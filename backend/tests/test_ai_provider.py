from ai.provider import AIProvider


def test_ai_provider_connection():
    provider = AIProvider()

    response = provider.chat(
        "You are a coding assistant.",
        "Reply with exactly: PATCHLENS_OK",
    )

    assert response
    assert "PATCHLENS" in response.upper()