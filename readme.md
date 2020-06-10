# lichess discord bot
[![Discord Bots](https://discordbots.org/api/widget/status/490949867657494530.svg)](https://discordbots.org/bot/490949867657494530)
[![Build Status](https://github.com/door-bell/lichess-discord/workflows/Node.js%20CI/badge.svg)](https://github.com/door-bell/lichess-discord/actions?query=workflow%3A%22Node.js+CI%22)

# Setup

1. Edit `config.example.json` and rename it to `config.json`

2. Run `index.js`

# Features

1. Link your lichess username with this bot to get customized commands!

# Command List
```
!arena [username]
    Find an upcoming or recent arena created by lichess (or a user)
!deleteuser
    Deletes your lichess username from the bot's database
!help
    Sends a list of available commands
!playing [username]
    Shares your (or a user's) ongoing game
!profile [username]
    Displays your (or a user's) profile
!recent [rated/casual]
    Shares your most recent game
!setgamemode [game mode]
    Sets your favorite game (or puzzle) mode
!setuser <username>
    Sets your lichess username
!stop
    Stops the bot (owner only)
!tv [game mode]
    Shares the featured game
!whoami
    Returns your current lichess username
```
