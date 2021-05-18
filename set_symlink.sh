#!/bin/zsh

root="$(pwd)"
ln -s "$root/git_hooks/pre-commit" "$root/.git/hooks/pre-commit"
