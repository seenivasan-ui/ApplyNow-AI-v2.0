#!/usr/bin/env bash

python -m pip install --upgrade pip
pip install fastapi uvicorn
pip install -r backend/requirements.txt
playwright install chromium