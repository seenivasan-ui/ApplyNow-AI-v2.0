#!/usr/bin/env bash

python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt
playwright install chromium