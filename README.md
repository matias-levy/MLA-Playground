# [MLA Labs' no-nonsense audio playground](https://playground.mlalabs.xyz/)

## What is it?

It's just that, a simple and intuitive playground for sound processing that runs directly on the browser. Choose any input device—your microphone, a synth, or even a noisy fan—and run it through the playground’s effects. Or, if you’re feeling adventurous, upload any file (yes, even an image or text file!) in the File tab and explore how it sounds when looped, detuned, or warped with different playback rates.

Need inspiration? Log in with FreeSound and dive into their massive collection of samples—you might stumble upon the perfect starting point!

With a variety of effects at your fingertips, tweak, twist, and shape the sound in real-time. Once you’ve crafted something unique, try recording it! You can then download your creation or reintroduce it as an input to push your experiment even further.

No rules, just sonic exploration—let’s see what you can create! 🚀🔊

## Stack used

- Next Js 15
- Tailwind CSS v4
- [ShadCn](https://ui.shadcn.com/docs/components/accordion) / Radix UI
- [dnd kit](https://dndkit.com/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)


## Env file structure

For usage of the Freesound API you should include a .env file with the following definitions

```
NEXT_PUBLIC_FREESOUND_CLIENT_ID=[client id of the Freesound registered API]
FREESOUND_CLIENT_SECRET=[Freesound API secret]
NEXT_PUBLIC_AUTH_REDIRECT=[root domain]
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deploy on Vercel

The easiest way to deploy the app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


