# Scripts

## add-user.js
```bash
# Basic
node scripts/add-user.js --username="ms@remap.ai" --password="hello-world"

# With role [admin|user|moderator|viewer]
node scripts/add-user.js --username="ms@remap.ai" --password="hello-world" --role="admin"
```

## verify-user.js
```bash
node scripts/verify-user.js --username="ms@remap.ai"
```

## change-password.js
```bash
node scripts/change-password.js --username="ms@remap.ai" --password="new-password"
```

## remove-user.js
```bash
node scripts/remove-user.js --username="ms@remap.ai"
```
