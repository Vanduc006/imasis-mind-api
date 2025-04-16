#!/bin/bash

echo ">>> Making ports public..."

# Force public visibility on needed ports
gh codespace ports visibility 3000:public -c "$CODESPACE_NAME"
gh codespace ports visibility 3001:public -c "$CODESPACE_NAME"