# Base Mini App Migration Checklist

Your app has been migrated to work as a Base Mini App! Here's what's been set up and what you need to do next.

## ✅ Completed Steps

1. **MiniApp SDK Integration** ✅
   - SDK is installed (`@farcaster/miniapp-sdk`)
   - `BaseMiniAppBootstrap` component calls `sdk.actions.ready()`
   - Component is integrated in `app/layout.tsx`

2. **Manifest File** ✅
   - Created at `public/.well-known/farcaster.json`
   - Route handler created at `app/.well-known/farcaster.json/route.ts` to serve it
   - All miniapp fields are configured

3. **Embed Metadata** ✅
   - Added `fc:miniapp` metadata in `app/layout.tsx` using Next.js metadata API
   - Configured for rich embeds when shared

4. **Webhook Endpoint** ✅
   - Created at `app/api/webhook/route.ts`
   - Ready to receive events from Base app

## 🔧 Next Steps (You Need to Do)

### 1. Update Your Domain in Manifest
Update `public/.well-known/farcaster.json` with your actual Vercel deployment URL:
- Replace `https://morl.vercel.app` with your actual domain
- Update all image URLs (icon, splash, screenshots, OG image)

### 2. Add Your Base Account Address
In `public/.well-known/farcaster.json`, add your Base Account address:
```json
"baseBuilder": {
  "ownerAddress": "0xYourBaseAccountAddress"
}
```

### 3. Generate Account Association Credentials
1. **Deploy to Vercel first** (make sure manifest is live)
2. Go to [Base Build Account Association Tool](https://docs.base.org/mini-apps/quickstart/migrate-existing-apps#react)
3. Paste your app URL (e.g., `https://your-app.vercel.app`)
4. Click "Submit" then "Verify"
5. Follow instructions to generate the `accountAssociation` fields
6. Copy the generated fields and paste them into `public/.well-known/farcaster.json`:
   ```json
   "accountAssociation": {
     "header": "...",
     "payload": "...",
     "signature": "..."
   }
   ```

### 4. Create Required Images
Make sure you have these images in your `public/` folder (or update URLs in manifest):
- `icon.png` - App icon (recommended: 512x512px)
- `splash.png` - Splash screen image
- `og.png` - Open Graph image for embeds
- `screen1.png` - Screenshot for app store

### 5. Deploy to Vercel
```bash
git add .
git commit -m "Migrate to Base Mini App"
git push origin main
```

Vercel should auto-deploy. If not, manually redeploy from the Vercel dashboard.

### 6. Preview Your App
1. Go to [Base Build Preview Tool](https://docs.base.org/mini-apps/quickstart/migrate-existing-apps#react)
2. Add your app URL
3. Verify:
   - ✅ Embeds display correctly
   - ✅ Account association is verified
   - ✅ Metadata is complete
   - ✅ App launches correctly

### 7. Publish to Base App
Create a post in the Base app with your app's URL to publish it!

## 📝 Notes

- The manifest is accessible at `https://your-domain.com/.well-known/farcaster.json`
- The webhook is at `https://your-domain.com/api/webhook`
- All environment variables should be set in Vercel project settings
- Make sure your Vercel deployment is connected to your GitHub repo for auto-deploys

## 🔗 Resources

- [Base Mini Apps Documentation](https://docs.base.org/mini-apps/quickstart/migrate-existing-apps#react)
- [Base Build Preview Tool](https://build.base.org/preview)
- [Account Association Tool](https://build.base.org/account-association)

