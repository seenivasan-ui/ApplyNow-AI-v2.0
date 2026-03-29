#!/usr/bin/env bash

python -m pip install --upgrade pip
pip install -r backend/requirements.txt
playwright install --with-deps chromium