import re

def format_category(category: str) -> str:
    """Format category string with proper spacing between words."""
    # Use regex to insert spaces between lowercase followed by uppercase/numbers
    formatted = re.sub(r'([a-z])([A-Z0-9])', r'\1 \2', category)
    # Insert space between end of word and beginning of new one
    return formatted 