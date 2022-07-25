This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Documentation: Orbis sdk

This example is built using the [Orbis SDK](https://orbis.club/developers) that developers can use to created decentralized and composable social applications / features very easily. The SDK documentation can be accessed [here](https://orbis.club/developers).

We encourage you to fork this repository and start building on top of the Orbis SDK! You can also use this project to embed your own community discussion layer on your own website instead of relying on centralized alternatives.

To do so simply update the `GROUP_ID` value in the `app.js` file to load your own group instead. Group creation isn't available in this project for now, if you want to create a new group you can do so using the [orbis.club](https://orbis.club/) app or update this repository to support the [createGroup](https://orbis.club/developers/api-documentation/createGroup) function from the SDK.
