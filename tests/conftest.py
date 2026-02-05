"""
Shared test fixtures and configuration.
"""
import pytest


@pytest.fixture
def sample_prompt():
    """Fixture providing a sample prompt for testing."""
    return "Hello, how are you?"
