import { TwitterApi } from "twitter-api-v2";

const client = new TwitterApi({
  appKey: "oapzlwfSiLMSYHx8F2k7Fceq5",
  appSecret: "daW5Y37rKZzqYLw7FfV0NF9XhEvejGwp7ZluanXBnlpI6D5FWd",
  accessToken: "1889766730001686529-M2OVXm4e17PRg4lPd8o2lgla6osXmW",
  accessSecret: "shRmz6JyUM9pd5tZM6fR97pNT0BRQghAyOicluG9hAiXm",
});

// Function to tweet the coin flip result
export const tweetResult = async (tweetContent: string) => {
  //   const result = coinFlip();
  const tweet = "Hello fams, How are you today.😀";

  try {
    // Post the tweet to Twitter
    await client.v2.tweet(tweetContent);
    console.log(`Successfully tweeted: ${tweetContent}`);
  } catch (error) {
    console.error("Error posting tweet:", error);
  }
};
