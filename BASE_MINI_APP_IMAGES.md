# Base Mini App Image Requirements

Here's what each image in your `farcaster.json` manifest is used for:

## 📸 Image Types & Requirements

### 1. **iconUrl** (`icon.png`) ✅ You have this
- **Purpose**: App icon shown in the Base Mini App directory/launcher
- **Recommended Size**: 512x512px or 1024x1024px (square)
- **Format**: PNG with transparency
- **Usage**: Small icon in app listings, menus, etc.

### 2. **splashImageUrl** (`splash.png`) ❌ Need to create
- **Purpose**: Full-screen loading image shown while your app loads
- **Recommended Size**: 1200x1200px or 1920x1080px (square or 16:9)
- **Format**: PNG or JPG
- **Usage**: Displayed immediately when user opens your app, before `sdk.actions.ready()` is called
- **Design Tips**:
  - Should match your app's branding
  - Include your logo/app name
  - Use `splashBackgroundColor` (#020617) as the background
  - Keep it simple - users see this briefly while loading

### 3. **heroImageUrl** (`og.png`) ❌ Need to create
- **Purpose**: Large featured image in app discovery/listing pages
- **Recommended Size**: 1200x630px (Open Graph standard) or 1920x1080px
- **Format**: PNG or JPG
- **Usage**: Featured image when your app is showcased in Base Mini App directory
- **Design Tips**:
  - Should be eye-catching and represent your app
  - Include app name, tagline, or key visuals
  - Similar to app store hero images

### 4. **ogImageUrl** (`og.png`) ❌ Need to create
- **Purpose**: Social media preview image (Open Graph)
- **Recommended Size**: 1200x630px (standard Open Graph size)
- **Format**: PNG or JPG
- **Usage**: Shows when your app is shared on Twitter/X, Warpcast, etc.
- **Design Tips**:
  - Should look good as a link preview card
  - Include app name, tagline, and key visual
  - Text should be readable at small sizes
  - Can be the same as `heroImageUrl`

### 5. **screenshotUrls** (`screen1.png`) ❌ Need to create
- **Purpose**: App screenshots for the app store/listing
- **Recommended Size**: 1920x1080px or device-specific (e.g., 750x1334px for iPhone)
- **Format**: PNG or JPG
- **Usage**: Multiple screenshots showing your app's UI/features
- **Design Tips**:
  - Show actual screenshots of your game
  - Can include multiple screenshots: `["screen1.png", "screen2.png", "screen3.png"]`
  - Should showcase gameplay, UI, and key features
  - Consider adding device frames for polish

## 🎨 Quick Solution: Use Your Dynamic Image Generator

Since you already have a dynamic image generator at `/api/og`, you can:

1. **For `ogImageUrl` and `heroImageUrl`**: Use a static version of your game result image
   - Create a generic version: `https://morless.vercel.app/api/og?category=spotify&score=5&total=5&streak=7&perfect=true&pattern=11111`
   - Or create a static `og.png` file

2. **For `splashImageUrl`**: Create a simple loading screen with your logo
   - Can be a static image or use your dynamic generator with default values

3. **For `screenshotUrls`**: Take actual screenshots of your game
   - Screenshot the game in action
   - Show the comparison cards, score, etc.

## 📝 Recommended Image Sizes Summary

| Image Type | Size | Format | Priority |
|------------|------|--------|----------|
| `icon.png` | 512x512px | PNG | ✅ You have |
| `splash.png` | 1200x1200px | PNG | ⚠️ High |
| `og.png` | 1200x630px | PNG | ⚠️ High |
| `screen1.png` | 1920x1080px | PNG | ⚠️ Medium |

## 🚀 Quick Fix: Create Placeholder Images

You can create simple placeholder images using your existing dynamic image generator or create static images. The most important ones are:
- `splash.png` - Users see this immediately
- `og.png` - Used for social sharing and hero image

Would you like me to:
1. Create a simple API route that generates these images?
2. Update the manifest to use your dynamic image generator temporarily?
3. Provide instructions for creating these images manually?

