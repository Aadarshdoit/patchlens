# PatchLens Security Model

PatchLens is a **hackathon prototype**. This document describes its actual
security posture honestly. It does **not** claim production-grade sandboxing.

---

## Threat Model

### Inputs that are potentially untrusted

| Input | Source | Risk level |
|---|---|---|
| `repository` path | API request body | High – path traversal, arbitrary filesystem access |
| `patch_file` path | API request body | High – path traversal, read arbitrary files |
| `reproduction_command` | API request body | Critical – arbitrary command execution |
| Patch file contents | Filesystem read | Medium – malformed diff, embedded special characters |

### Main risks

1. **Arbitrary command execution** – A caller who controls `reproduction_command`
   could pass any executable and arguments.  The current prototype restricts the
   first token to an allowlist of safe interpreters (`python`, `py`, `python3`,
   `pytest`).  This is not a sandbox; it only prevents trivially obvious misuse.

2. **Path traversal** – Paths such as `../../etc/passwd` or
   `C:\Windows\System32` could be supplied as `repository` or `patch_file`.
   The API validates that paths resolve to an allowed project root before
   proceeding.  Paths outside the configured root are rejected.

3. **Malicious Git patches** – A crafted `.diff` file could contain shell
   metacharacters, but `git apply` is invoked via an argument array (never
   `shell=True`), so shell interpretation does not occur.  A malformed patch
   produces a controlled `PatchApplicationError` instead of a server crash.

4. **Long-running processes** – Reproduction and test commands have explicit
   timeouts (`REPRODUCTION_TIMEOUT_SECONDS = 10`,
   `TEST_TIMEOUT_SECONDS = 30`).  A timed-out process returns a structured
   `timed_out=True` result rather than hanging indefinitely.

5. **Resource exhaustion** – CPU and memory are **not** bounded at the OS
   level in the current prototype.  A slow or memory-hungry reproduction
   script could consume significant host resources.  See _Current Limitations_.

6. **Temporary-directory leakage** – Patched repository copies are created in
   the system temp directory.  The prototype now cleans them up in a `finally`
   block after verification completes, preventing indefinite accumulation.

7. **Access to host files** – The API path-validation guard reduces (but does
   not eliminate) the risk of reading arbitrary host files.  The prototype does
   not run inside a container or chroot.

8. **Environment-variable exposure** – `subprocess.run` inherits the parent
   process environment.  The `GROQ_API_KEY` and any other secrets present in
   the process environment are therefore accessible to child processes.  The
   current prototype mitigates this only by relying on the `.env` file not
   being committed (see _Secrets_).

9. **Network access from executed code** – Reproduction scripts and test suites
   run with full network access.  There is no firewall or network namespace
   isolation.  A malicious or buggy reproduction script could make outbound
   network calls.

10. **Running arbitrary public repositories** – There is no repository
    allowlist at the clone or fetch stage.  The current prototype is intended
    to verify only local, pre-approved repositories.

---

## Controlled Execution

Subprocess invocations in the verification engine use **argument arrays**, never
`shell=True`.  This means:

- Shell metacharacters in arguments are passed literally, not interpreted.
- There is no implicit invocation of `cmd.exe` or `/bin/sh`.
- Commands such as `["python", "reproduce.py"]` are safe even if the filename
  contains spaces.

The execution path is:

```
verifier.py
  → reproducer.run_command(command_list, cwd, timeout)   # no shell=True
  → patcher.create_patched_copy(...)
      → subprocess.run(["git", "apply", patch], ...)     # no shell=True
  → reproducer.run_command(command_list, cwd, timeout)   # no shell=True
  → pytest_runner.run_pytest(repo, timeout)              # sys.executable -m pytest
```

---

## Command Validation

`run_command` validates the first token of every reproduction command against
an explicit allowlist before execution:

```python
ALLOWED_COMMANDS = {"python", "py", "python3", "pytest"}
```

Any command whose first token is not in this set is rejected with a
`ValueError` before a subprocess is created.  This is a **prototype-level**
guard, not a full sandboxed executor.

---

## Timeouts

| Constant | Value | Applied to |
|---|---|---|
| `REPRODUCTION_TIMEOUT_SECONDS` | 10 s | Each `run_command` call |
| `TEST_TIMEOUT_SECONDS` | 30 s | `run_pytest` |

Timeout expiry is caught and returned as a structured result with
`timed_out=True`.  It does not crash the API.

---

## Temporary Workspaces

Patched repository copies are placed in the system temporary directory under
the prefix `patchlens-`.  After all verification steps complete (or if an
error occurs), the temporary directory is deleted in a `finally` block.  This
prevents unbounded accumulation of repository copies on the host filesystem.

---

## Patch Application

Patches are applied via:

```python
subprocess.run(["git", "apply", str(patch_path)], cwd=destination, ...)
```

- Argument array – no shell interpretation.
- A non-zero exit code from `git apply` raises `PatchApplicationError` with
  the captured stderr included.  The caller receives a structured error rather
  than an unhandled exception.
- The patch path is resolved and checked for existence before the subprocess
  is created.

---

## Path Handling

The API resolves all incoming paths with `Path.resolve()` (removes `..`
traversal) and then checks whether the resolved path starts with the
**configured project root** (`PATCHLENS_PROJECT_ROOT`, defaulting to the
project directory).  Requests referencing paths outside this root are rejected
with HTTP 400 before any filesystem operation occurs.

The `patch_file` path is additionally checked to have a `.diff` or `.patch`
extension.

These checks reduce accidental misuse; they do not constitute a fully secure
access-control model.

---

## Secrets

- `backend/.env` is excluded from version control by `.gitignore`.
- `backend/.env.example` contains **placeholder values only** — no real keys.
- The `GROQ_API_KEY` is never logged or returned in API responses.
- API error responses do not echo environment variables or raw exception
  messages that could leak secret material.

---

## Current Limitations

The following risks are **known and not fully mitigated** in the prototype:

| Risk | Status |
|---|---|
| CPU / memory limits for child processes | ❌ Not enforced |
| Network isolation for executed code | ❌ Not enforced |
| Filesystem isolation (chroot / namespace) | ❌ Not enforced |
| Container or VM boundary | ❌ Not present |
| Full command allowlist coverage | ⚠️ Prototype only (4 tokens) |
| Inherited environment variables | ⚠️ Subprocess inherits full env |
| Repository allowlist | ⚠️ Project-root check only |

Do **not** run PatchLens against untrusted repositories or untrusted patches
in a production environment without additional isolation.

---

## Production Hardening

A production implementation of PatchLens should consider the following
mitigations.  **None of these currently exist in the prototype.**

- **Container isolation** – Run each verification job inside a fresh,
  short-lived container (e.g., Docker or Podman) that is destroyed after the
  job completes.
- **CPU and memory limits** – Apply `ulimit` or cgroup-based resource limits
  to prevent a single verification job from exhausting host resources.
- **Filesystem isolation** – Mount the repository copy read-only where
  possible; bind-mount only the minimal required paths.
- **Restricted networking** – Drop all outbound network access from the
  verification container via iptables rules or network namespace isolation.
- **Non-root execution** – Run the verification subprocess as a dedicated
  unprivileged user or inside a user namespace.
- **Stronger sandboxing** – Consider seccomp profiles, AppArmor/SELinux
  policies, or a purpose-built sandbox such as gVisor.
- **Repository allowlisting** – Maintain an explicit list of permitted
  repository paths; reject any verification request that references a path
  not in the allowlist.
- **Patch size and content limits** – Reject patches exceeding a configurable
  size limit and scan for obvious attack patterns before applying.
- **Audit logging** – Log all verification requests (without secret material)
  for forensic traceability.
