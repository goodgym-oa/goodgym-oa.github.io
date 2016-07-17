
rm -rf out || exit 0;
./accept-invitations.js --token ${GH_TOKEN}
./distribute.js --token ${GH_TOKEN}