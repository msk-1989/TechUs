#!/bin/bash
cd /home/z/my-project
unset DATABASE_URL
exec bun run dev
