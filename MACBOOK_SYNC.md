# Hooked MacBook Sync Setup

This project now lives in GitHub:

https://github.com/emenous/Hooked

## One-Time MacBook Setup

1. Install Git:

   ```bash
   git --version
   ```

   If Git is missing, macOS will usually prompt you to install the Command Line Tools. You can also run:

   ```bash
   xcode-select --install
   ```

2. Pick a local folder:

   ```bash
   mkdir -p ~/Documents/Projects
   cd ~/Documents/Projects
   ```

3. Clone the repo:

   ```bash
   git clone https://github.com/emenous/Hooked.git
   cd Hooked
   ```

4. Configure your Git identity:

   ```bash
   git config user.name "emenous"
   git config user.email "60203271+emenous@users.noreply.github.com"
   ```

5. Authenticate with GitHub when prompted.

   If normal HTTPS auth asks for a password, use GitHub CLI instead:

   ```bash
   brew install gh
   gh auth login
   gh auth setup-git
   ```

## Daily Workflow

Always pull before editing:

```bash
cd ~/Documents/Projects/Hooked
git pull
```

After editing:

```bash
git status
git add .
git commit -m "Describe the change"
git push
```

On the other computer, run:

```bash
git pull
```

## Local Playtesting

From the project folder:

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:8765/index.html
```

If files look stale, add a cache token:

```text
http://127.0.0.1:8765/index.html?check=macbook
```

## Live URLs

GitHub Pages URL:

```text
https://emenous.github.io/Hooked/
```

Existing Hostinger URL:

```text
https://prntscrn.dev/Hooked/
```

## Safe Two-System Rule

Before working:

```bash
git pull
```

After working:

```bash
git add .
git commit -m "Describe the change"
git push
```

Treat GitHub as the source of truth. Treat Hostinger as a deployment target.
