#!/bin/bash
echo "Installing dependencies..."
pip install -r requirements.txt
echo "Downloading Spacy English Core SM language model for Presidio..."
python -m spacy download en_core_web_sm
echo "Backend environment initialized."
