## Optional: Making the working environment less cluttered

In VSCode, press <keyboard>ctrl</keyboard><keyboard>shift</keyboard><keyboard>p</keyboard>, and write "open workspace settings"

We're going to hide the files we don't want to see, so they don't clutter our tree. Look for `files.exclude`, and add:

- `**/*node_modules` to hide that folder
- `**/*.vscode` to hide the settings themselves
- `**/*package-lock.json`

Add them to `search: Exclude` too, so you they don't clutter your search results

While you're at it, set the tab size to `2` to enforce editor-level consistency when handling indents

If you use [prettier](https://github.com/prettier/prettier-vscode) or [unibeautify](https://github.com/Unibeautify/vscode), now would be a good time to add this configuration too, to enforce consistent styling.