#!/bin/bash
set -e # exit with nonzero exit code if anything fails

# squash messages
git config --global push.default matching

cd ${DIR_NAME}
git clone "https://${GH_TOKEN}@${GH_REF}"
cd ${REPO_NAME}

git config user.name "Openactive Bot"
git config user.email "hello@openactive.io"

echo ""
echo "Git version..."
git --version

echo "Overwriting directory.json ..."
echo "${DIRECTORY_JSON}" > directory.json
cat directory.json

echo ""
echo "Checking if directory.json has changed..."
git add directory.json
if git diff-index --cached --quiet HEAD --; then 
  echo "No changes";
else 
  echo "There are changes" 
  echo ""
  echo "Committing directory.json..."
  git commit -m "Regeneration of directory.json by Openactive Bot";
fi
    
echo ""
echo "Pushing..."
git push -q
echo "Push complete"

echo ""

exit 0
