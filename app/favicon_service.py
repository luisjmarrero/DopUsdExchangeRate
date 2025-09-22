import requests
import logging
from typing import Optional, Dict, Tuple
from urllib.parse import urljoin, urlparse
from app.database import SessionLocal
from app.models_db import BankDB

logger = logging.getLogger(__name__)

# Bank website URL mapping
BANK_URLS = {
    "Banreservas": "https://www.banreservas.com/",
    "Scotiabank": "https://do.scotiabank.com/",
    "BHD": "https://bhd.com.do/",
    "Lopez de Haro": "https://www.blh.com.do/",
    "Banco Popular": "https://www.popularenlinea.com/",
    "APAP": "https://www.apap.com.do/"
}

class FaviconService:
    """Service for fetching and managing bank favicons and images"""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })

    def is_image_url(self, url: str) -> bool:
        """Check if a URL points to an image file"""
        if not url:
            return False

        # Check file extension
        image_extensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico']
        parsed_url = urlparse(url.lower())
        path = parsed_url.path

        return any(path.endswith(ext) for ext in image_extensions)

    def validate_image_url(self, url: str) -> Tuple[bool, Optional[str]]:
        """Validate if URL is accessible and is an image"""
        try:
            response = self.session.head(url, timeout=5)
            if response.status_code != 200:
                return False, None

            content_type = response.headers.get('content-type', '').lower()
            if content_type.startswith('image/'):
                return True, content_type

            # If content-type is not available, check URL extension
            if self.is_image_url(url):
                return True, 'image/*'

            return False, None

        except Exception as e:
            logger.warning(f"Error validating image URL {url}: {e}")
            return False, None

    def get_bank_website_url(self, bank_name: str) -> Optional[str]:
        """Get the website URL for a bank"""
        return BANK_URLS.get(bank_name)

    def fetch_favicon_url(self, website_url: str) -> Optional[str]:
        """Fetch favicon URL from a website or use image URL if applicable"""
        try:
            # First, check if the website URL itself is an image
            if self.is_image_url(website_url):
                is_valid, content_type = self.validate_image_url(website_url)
                if is_valid:
                    logger.info(f"Using website URL as image: {website_url}")
                    return website_url

            # Try the standard favicon location
            parsed_url = urlparse(website_url)
            favicon_url = f"{parsed_url.scheme}://{parsed_url.netloc}/favicon.ico"

            response = self.session.head(favicon_url, timeout=5)
            if response.status_code == 200:
                logger.info(f"Found favicon at {favicon_url}")
                return favicon_url

            # If favicon.ico doesn't exist, try to fetch the HTML and look for favicon links
            response = self.session.get(website_url, timeout=10)
            response.raise_for_status()

            # Look for favicon links in HTML
            import re
            favicon_patterns = [
                r'<link[^>]*rel=["\'](?:shortcut )?icon["\'][^>]*href=["\']([^"\']+)["\']',
                r'<link[^>]*href=["\']([^"\']+)["\'][^>]*rel=["\'](?:shortcut )?icon["\']'
            ]

            for pattern in favicon_patterns:
                matches = re.findall(pattern, response.text, re.IGNORECASE)
                if matches:
                    favicon_url = urljoin(website_url, matches[0])
                    # Check if the found favicon is actually an image URL
                    if self.is_image_url(favicon_url):
                        is_valid, content_type = self.validate_image_url(favicon_url)
                        if is_valid:
                            logger.info(f"Found image favicon link: {favicon_url}")
                            return favicon_url
                    else:
                        # Regular favicon, just return it
                        logger.info(f"Found favicon link: {favicon_url}")
                        return favicon_url

            logger.warning(f"No favicon found for {website_url}")
            return None

        except Exception as e:
            logger.error(f"Error fetching favicon for {website_url}: {e}")
            return None

    def update_bank_favicon(self, bank_name: str) -> bool:
        """Update favicon URL for a specific bank"""
        db = SessionLocal()
        try:
            bank = db.query(BankDB).filter(BankDB.name == bank_name).first()
            if not bank:
                logger.warning(f"Bank {bank_name} not found in database")
                return False

            website_url = self.get_bank_website_url(bank_name)
            if not website_url:
                logger.warning(f"No website URL configured for {bank_name}")
                return False

            favicon_url = self.fetch_favicon_url(website_url)
            if favicon_url:
                setattr(bank, 'favicon_url', favicon_url)
                db.commit()
                logger.info(f"Updated favicon for {bank_name}: {favicon_url}")
                return True
            else:
                logger.warning(f"Could not fetch favicon for {bank_name}")
                return False

        except Exception as e:
            logger.error(f"Error updating favicon for {bank_name}: {e}")
            db.rollback()
            return False
        finally:
            db.close()

    def update_all_bank_favicons(self) -> Dict[str, bool]:
        """Update favicons for all banks"""
        results = {}
        for bank_name in BANK_URLS.keys():
            success = self.update_bank_favicon(bank_name)
            results[bank_name] = success

        return results

    def get_bank_favicon(self, bank_name: str) -> Optional[str]:
        """Get favicon URL for a bank from database"""
        db = SessionLocal()
        try:
            bank = db.query(BankDB).filter(BankDB.name == bank_name).first()
            return getattr(bank, 'favicon_url', None) if bank else None
        finally:
            db.close()

    def set_bank_favicon(self, bank_name: str, favicon_url: str) -> bool:
        """Manually set favicon URL for a bank (useful for testing image URLs)"""
        db = SessionLocal()
        try:
            bank = db.query(BankDB).filter(BankDB.name == bank_name).first()
            if not bank:
                logger.warning(f"Bank {bank_name} not found in database")
                return False

            setattr(bank, 'favicon_url', favicon_url)
            db.commit()
            logger.info(f"Manually set favicon for {bank_name}: {favicon_url}")
            return True

        except Exception as e:
            logger.error(f"Error setting favicon for {bank_name}: {e}")
            db.rollback()
            return False
        finally:
            db.close()

# Global service instance
favicon_service = FaviconService()