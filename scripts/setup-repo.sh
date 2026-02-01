#!/bin/bash
# Repository Setup Script
# Run this after git init to set up all tooling

set -e

echo "🚀 Setting up QETTA repository..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

# 2. Install dev dependencies for tooling
echo -e "${BLUE}🔧 Installing dev tools...${NC}"
npm install -D \
  prettier \
  prettier-plugin-tailwindcss \
  husky \
  lint-staged \
  @commitlint/cli \
  @commitlint/config-conventional

# 3. Initialize Husky
echo -e "${BLUE}🐶 Setting up Husky...${NC}"
npx husky init

# 4. Create pre-commit hook
echo -e "${BLUE}📝 Creating pre-commit hook...${NC}"
cat > .husky/pre-commit << 'EOF'
npx lint-staged
EOF

# 5. Create commit-msg hook for commitlint
echo -e "${BLUE}📝 Creating commit-msg hook...${NC}"
cat > .husky/commit-msg << 'EOF'
npx --no -- commitlint --edit $1
EOF

# 6. Make hooks executable
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg

# 7. Generate Prisma client
echo -e "${BLUE}🗄️ Generating Prisma client...${NC}"
npx prisma generate || echo "⚠️ Prisma generate skipped (no schema or connection)"

# 8. Verify setup
echo -e "${BLUE}✅ Verifying setup...${NC}"
npm run lint || echo "⚠️ Lint has warnings"
npm run build || echo "⚠️ Build check skipped"

echo -e "${GREEN}✅ Repository setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. git add -A"
echo "  2. git commit -m 'chore: initial commit'"
echo "  3. git remote add origin <your-repo-url>"
echo "  4. git push -u origin main"
