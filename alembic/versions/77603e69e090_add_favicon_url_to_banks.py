"""add_favicon_url_to_banks

Revision ID: 77603e69e090
Revises: 40da05a94f72
Create Date: 2025-08-25 19:29:56.771072

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '77603e69e090'
down_revision: Union[str, Sequence[str], None] = '40da05a94f72'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add favicon_url column to banks table
    op.add_column('banks', sa.Column('favicon_url', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove favicon_url column from banks table
    op.drop_column('banks', 'favicon_url')
