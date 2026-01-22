# How to Run Blender Scripts

## Method 1: Scripting Workspace (Easiest)

1. **Open Blender**
   - Launch Blender application

2. **Switch to Scripting Workspace**
   - Click the "Scripting" tab at the top of the Blender window
   - Or press `Ctrl+Left Arrow` / `Ctrl+Right Arrow` to switch workspaces

3. **Open the Script**
   - Click "Open" button in the text editor
   - Or go to `Text → Open Text Block`
   - Navigate to: `/Users/8bit/Downloads/ai-town/x402-world/blender/ralph_town_materials.py`
   - Select the file and click "Open"

4. **Run the Script**
   - Click the "Run Script" button (play icon) in the text editor header
   - Or press `Alt+P`
   - Or go to `Text → Run Script`

5. **Verify Materials Created**
   - Switch to "Shading" workspace
   - Check the materials list (dropdown in material properties)
   - You should see all the materials like "Oracle_Robe", "Mixer_Body", etc.

## Method 2: Copy and Paste

1. **Open Blender**
2. **Switch to Scripting Workspace**
3. **Create New Text Block**
   - Click "New" button in the text editor
4. **Paste Script**
   - Copy the entire script content
   - Paste into the text editor
5. **Run Script**
   - Click "Run Script" or press `Alt+P`

## Method 3: Command Line (Advanced)

Run Blender from terminal with the script:

```bash
cd /Users/8bit/Downloads/ai-town/x402-world/blender
blender --background --python ralph_town_materials.py
```

Or if you want to open Blender GUI and run the script:

```bash
blender --python ralph_town_materials.py
```

## Method 4: Add-on (For Repeated Use)

1. **Open Blender**
2. **Go to Edit → Preferences → Add-ons**
3. **Click "Install..."**
4. **Select the Python file**
5. **Enable the add-on**
6. **Use it from the Add-ons menu**

## Troubleshooting

### Script doesn't run
- Make sure you're in Scripting workspace
- Check the console (Window → Toggle System Console) for errors
- Verify the script syntax is correct

### Materials not appearing
- Check the console for error messages
- Make sure you're looking in the right place (Material Properties panel)
- Try running the script again

### Blender version compatibility
- This script uses Blender 2.8+ API
- For older versions, some node names might differ

## Quick Reference

- **Open Script**: `Text → Open Text Block` or click "Open"
- **Run Script**: `Alt+P` or click "Run Script" button
- **New Script**: Click "New" button
- **Save Script**: `Text → Save` or `Ctrl+S`
- **Console**: `Window → Toggle System Console` (to see errors)

## Expected Output

After running `ralph_town_materials.py`, you should see:
- Console message: `✅ Material library created with XX materials`
- All materials available in Material Properties dropdown
- Materials ready to assign to objects

## Next Steps

After creating materials:
1. Select an object
2. Go to Material Properties tab
3. Click "New" or assign existing material
4. Choose from the created materials (e.g., "Oracle_Robe", "Mixer_Body")
