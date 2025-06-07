#!/usr/bin/env bash

# 1) Capture the sandbox root as the current directory
SANDBOX="$(pwd)"

# 2) Override cd so that it only allows paths under $SANDBOX
cd() {
  if [[ $# -eq 0 ]]; then
    target="$HOME"
  else
    target="$1"
  fi

  # Use realpath if available; otherwise fallback in a subshell
  if command -v realpath >/dev/null 2>&1; then
    target_abs="$(realpath "$target")"
  else
    # This tries to cd into “$target” in a subshell; if it fails, target_abs will be empty
    target_abs="$(cd "$target" 2>/dev/null && pwd)"
  fi

  case "$target_abs" in
    "$SANDBOX"* )
      builtin cd "$@"      # call the real cd if inside sandbox
      ;;
    *)
      echo "bash: cd: restricted"
      ;;
  esac
}

# 3) Now replace this process with a new Bash that is BOTH restricted (“--restricted”) AND interactive (“-i”).
#    We also add “--noprofile --norc” to avoid loading any user dotfiles that might override our cd() function.
exec /bin/bash --restricted -i --noprofile --norc
