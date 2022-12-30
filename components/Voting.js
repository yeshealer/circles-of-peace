import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { GlobalContext } from "../contexts/GlobalContext";
import VotingStats from "./VotingStats";
import {
  Button,
  Flex,
  Text,
  Title,
  Image,
  Card,
  Group,
  Badge,
  SimpleGrid,
} from "@mantine/core";
import { getAddressFromDid } from "@orbisclub/orbis-sdk/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Election,
  EnvOptions,
  PlainCensus,
  VocdoniSDKClient,
  Vote,
} from "@vocdoni/sdk";
import { useAccount, useConnect, useDisconnect, useSigner } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";
import ClientOnly from "./ClientOnly";
import ReactTimeAgo from "react-time-ago";
import Causes from "./Causes";
import { Feed } from "../components/Feed";
import { Post } from "./post/";
import { PostBox } from "./PostBox";

const ActiveElectionId =
  "c5d2460186f7b6c90493e2df4797854716358a092b8a72441a02020000000008";

export const delay = (ms) => new Promise((res) => setTimeout(res, ms));
const causes = Causes();
export function Voting() {
  const [vocdoniSDK, setVocdoniSDK] = useState();
  const [members, setMembers] = useState([]);
  const [activeElectionInfo, setActiveElectionInfo] = useState();
  const [lastElectionId, setLastElectionId] = useState(ActiveElectionId);
  const [loading, setLoading] = useState(false);
  const { group_id, orbis } = useContext(GlobalContext);
  const wrapperRef = useRef(null);
  const { address, isConnected } = useAccount();
  const { data: signer } = useSigner();
  const [isAdmin, setIsAdmin] = useState(false);
  const [comment, setComment] = useState();

  /** get members */
  useMemo(() => {
    console.log("🚀 ~ file: Voting.js:32 ~ useMemo ~ group_id", group_id);
    if (group_id) {
      loadMembers();
    }
  }, [group_id]);

  const {
    data: comments,
    isLoading: isLoadingComments,
    refetch: refetchComments,
  } = useQuery({
    queryKey: ["comments"],
    queryFn: async () =>
      await orbis
        .getPosts({
          context: ActiveElectionId,
        })
        .then((res) => res.data),
  });
  console.log("🚀 ~ file: Voting.js:70 ~ comments", comments);

  const mutation = useMutation({
    mutationFn: async ({ comment }) =>
      await orbis.createPost({
        body: comment,
        context: ActiveElectionId,
      }),
  });

  async function loadMembers() {
    let { data, error, status } = await orbis.getGroupMembers(group_id);

    if (data) {
      let censusAddresses = [];
      data.map((member) => {
        const { address } = getAddressFromDid(member.profile_details.did);
        censusAddresses.push(address);
      });
      setMembers(censusAddresses);
      console.log(
        "🚀 ~ file: Voting.js:33 ~ loadMembers ~ censusAddresses",
        censusAddresses
      );
    }
  }

  /** get voter */
  useEffect(() => {
    const setupVocdoni = async () => {
      if (signer) {
        const client = new VocdoniSDKClient({
          env: EnvOptions.DEV,
          wallet: signer,
        });
        const accountData = await client.createAccount();
        if (accountData.balance === 0) {
          await client.collectFaucetTokens();
        }

        setVocdoniSDK(client);
        console.log(
          "🚀 ~ file: Voting.js:45 ~ setupVocdoni ~ accountData",
          accountData
        );
      }
    };
    setupVocdoni();
  }, [signer]);

  useEffect(() => {
    if (address == "0xEd2eF70e8B1EBf95bDfD7ba692454143b2A8263B") {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    const fetchElection = async () => {
      if (signer && vocdoniSDK) {
        const info = await vocdoniSDK.fetchElection(lastElectionId);
        setActiveElectionInfo(info);
      }
    };
    fetchElection();
  }, [signer, vocdoniSDK]);

  // form to create census + add voters from orbis get joined
  const createCensus = async () => {
    const census = new PlainCensus();
    census.add(members);

    console.log("🚀 ~ file: Voting.js:85 ~ createCensus ~ census", census);

    return census;
  };

  const createElection = (census) => {
    const endDate = new Date();
    endDate.setHours(endDate.getHours() + 10);

    const election = Election.from({
      title: "Impact Next",
      description: "Peacemaker! If peace is a start, then what's next?",
      header: "https://source.unsplash.com/random",
      streamUri: "https://source.unsplash.com/random",
      endDate: endDate.getTime(),
      census,
      electionType: null,
    });

    election.addQuestion(
      "Impact Next",
      "What Sustainable Dev Goal would you prioritise?",
      [
        { title: "No Poverty", value: 0 },
        { title: "Zero Hunger", value: 1 },
        { title: "Good health and wellbeing", value: 2 },
        { title: "Quality Education", value: 3 },
        { title: "Gender Equality", value: 4 },
        { title: "Clean water and sanitation", value: 5 },
        { title: "Affordable and clean energy", value: 6 },
        { title: "Decent Work and Economic Growth", value: 7 },
        { title: "Industry, Innovation and Infrastructure", value: 8 },
        { title: "Reduced Inequalities", value: 9 },
        { title: "Sustainable Cities and Communities", value: 10 },
        { title: "Responsible Consumption and Production", value: 11 },
        { title: "Climate Action", value: 12 },
        { title: "Life Below Water", value: 13 },
        { title: "Life On Land", value: 14 },
        { title: "Partnerships for the Goals", value: 15 }
      ]
    );
    return election;
  };

  const voteElection = async (value) => {
    console.log("🚀 ~ file: Voting.js:150 ~ value", value);
    try {
      setLoading(true);
      console.log("voting...");
      vocdoniSDK.wallet = signer;
      console.log(
        `setting electionId ( ${lastElectionId} ) to client @ voting..`
      );
      vocdoniSDK.setElectionId(lastElectionId);
      const vote = new Vote([value]);
      console.log(`submitting vote ${vote}`);

      const confirmationId = await vocdoniSDK.submitVote(vote);

      console.log(
        "🚀 ~ file: Voting.js:149 ~ <Button onClick={ ~ confirmationId",
        confirmationId
      );
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const commentVoting = async () => {
    console.log("comment: ", comment);
    mutation.mutate(
      { comment },
      {
        onSuccess: (data, variables, context) => {
          refetchComments();
          console.log("onSuccess: ", data);
          alert("Your comment is successfully submitted");
        },
      }
    );
  };

  return (
    <ClientOnly>
      {!isConnected && (
        <Text size={"xl"}>
          After joining to Peacemakers, please connect your wallet to be part of
          the election
        </Text>
      )}

      <div className={"vote-container"} ref={wrapperRef}>
        {activeElectionInfo && (
          <Flex
            mih={50}
            gap="md"
            justify="center"
            align="center"
            direction="column"
            wrap="wrap"
            w="full"
          >
            {/* <Flex align={"center"} direction={"column"}>
              <Title order={2}>{activeElectionInfo._title.default}</Title>
              <Text fz="sm">id: {activeElectionInfo._id}</Text>
            </Flex>
            <Text fz="xl" weight={400}>
              {activeElectionInfo._description.default}
            </Text> */}

            <div
              style={{ width: 540, marginLeft: "auto", marginRight: "auto" }}
            >
              {/* <Image
                radius="md"
                src={activeElectionInfo._header}
                alt="Random unsplash image"
              /> */}
            </div>
            <Flex direction={"column"}>
              {/* <Card shadow="sm" p="lg" radius="md" withBorder> */}
              {/* <Card.Section> </Card.Section> */}
              {/* <Text fz="md">
                  URI: {activeElectionInfo._census._censusURI}
                </Text>
                <Text fz="md">ID: {activeElectionInfo._census._censusId}</Text> */}
              {/* </Card> */}
            </Flex>
            {/* final result: {activeElectionInfo._finalResults} */}
            <Flex direction={"column"} align="center">
              <Card shadow="sm" p="lg" radius="md" withBorder>
                <Title order={3}>
                  {activeElectionInfo._questions[0].title.default}
                </Title>
                <Text fz="lg">
                  {activeElectionInfo._questions[0].description.default}
                </Text>
                <Group position="apart" mt="md" mb="xs">
                  {/* <Text weight={500}>Census</Text> */}
                  <Badge color="dark" variant="light" size="xl">
                    Total vote: {activeElectionInfo._voteCount}
                  </Badge>
                </Group>
                <Flex direction={"row"} gap={"md"}>
                  <Text fz="sm">
                    Started{" "}
                    <ReactTimeAgo
                      date={activeElectionInfo._startDate}
                      locale="en-US"
                    />
                  </Text>

                  <Text fz="sm">
                    Ends{" "}
                    <ReactTimeAgo
                      date={activeElectionInfo._endDate}
                      locale="en-US"
                    />
                  </Text>
                </Flex>
              </Card>
            </Flex>
            {/* <div style={{ backgroundColor: "gray" }}>
              <VotingStats
                causes={activeElectionInfo._questions[0].choices}
                results={activeElectionInfo.results[0]}
              />
            </div> */}
            <SimpleGrid size="xxl" cols={4}>
              {isConnected &&
                activeElectionInfo._questions[0].choices.map(
                  (choice, index) => (
                    <>
                      <div>
                        {/* <Text fz="md">{choice.title.default}</Text> */}
                        {/* <Button
                      color={"violet"}
                      fullWidth
                      loading={loading}
                      loaderPosition="center"
                      onClick={() => voteElection(choice.value)}
                    > */}
                        {/* {choice.title.default} */}
                        <img
                          width={140}
                          height={140}
                          src={causes[choice.value].imgUrl}
                          onClick={() => voteElection(choice.value)}
                          style={{ borderRadius: "20%" }}
                        ></img>
                        {/* </Button> */}
                      </div>
                    </>
                  )
                )}
            </SimpleGrid>

            {/* <Flex direction={"column"}>
              <Card shadow="sm" p="lg" radius="md" withBorder>
                <Card.Section> </Card.Section>
                <Group position="apart" mt="md" mb="xs">
                  <Text weight={500}>Answers</Text>
                  {activeElectionInfo._results[0].map((result, index) => (
                    <>
                      <Text fz="md">
                        Choice {index}: {result}
                      </Text>
                    </>
                  ))}
                </Group>
              </Card>
            </Flex> */}

            <div className="flex-column w-100" style={{ paddingTop: "32px" }}>
              <div className="mbottom-15 z-index-15">
                {/* Comment Box */}
                <div className="flex-column w-100">
                  <div className={"postbox flex-column"}>
                    <div className={"flex flex-column"}>
                      <div className="editable-container">
                        <input
                          id="postbox-area"
                          autoFocus={true}
                          className="editable"
                          contentEditable={true}
                          data-placeholder={"Discuss about Inpact Next"}
                          onChange={(e) => {
                            console.log(e.target.value);
                            setComment(e.target.value);
                            console.log("comment", comment);
                          }}
                        ></input>
                      </div>
                    </div>
                    <button
                      disabled={mutation.isLoading}
                      className="btn purple md share pointer"
                      style={{ margin: "16px" }}
                      onClick={() => commentVoting()}
                    >
                      Comment
                    </button>
                  </div>
                </div>
              </div>

              {loading ? (
                <p className="center h-align-self-center w-100">
                  <img src="/img/icons/loading-white.svg" height="35" />
                </p>
              ) : (
                <>
                  {/** Show posts or empty state */}
                  {isLoadingComments ? (
                    <p className="center w-100 tertiary">Loading comments</p>
                  ) : (
                    <>
                      <div className="flex-row mbottom-10 relative">
                        <div className="flex-1"></div>
                      </div>
                      <Posts posts={comments} context={group_id} type="feed" />
                    </>
                  )}
                </>
              )}
            </div>
          </Flex>
        )}
        {isConnected && isAdmin && (
          <>
            <Flex
              pt={50}
              mih={50}
              gap="xs"
              justify="center"
              align="start"
              direction="column"
              wrap="wrap"
            >
              <Button
                color="gray"
                // fullWidth
                marginLeft="20"
                marginRight="20"
                loading={loading}
                loaderPosition="center"
                onClick={async () => {
                  try {
                    setLoading(true);

                    /** Create census with addresses */
                    const census = await createCensus();
                    /** Create election */
                    const election = await createElection(census);

                    const electionId = await vocdoniSDK.createElection(
                      election
                    );
                    console.log(
                      "🚀 ~ file: Voting.js:149 ~ onClick={ ~ electionId",
                      electionId
                    );
                    setLastElectionId(electionId); // also set electionId @ component state.
                    vocdoniSDK.setElectionId(electionId);

                    // wait for block get confirmed
                    delay(14000);
                  } catch (error) {
                    console.error(error);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Create Election
              </Button>
              {/* <Button
                color="gray"
                fullWidth
                loading={loading}
                loaderPosition="center"
                onClick={async () => {
                  try {
                    setLoading(true);
                    console.log("voting...");
                    vocdoniSDK.wallet = signer;
                    console.log(
                      `setting electionId ( ${lastElectionId} ) to client @ voting..`
                    );
                    vocdoniSDK.setElectionId(lastElectionId);
                    const vote = new Vote([0, 1]);
                    console.log(`submitting vote ${vote}`);

                    const confirmationId = await vocdoniSDK.submitVote(vote);

                    console.log(
                      "🚀 ~ file: Voting.js:149 ~ <Button onClick={ ~ confirmationId",
                      confirmationId
                    );
                  } catch (error) {
                    console.log(error);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Vote
              </Button> */}
              {/* <Button
                color="gray"
                fullWidth
                loading={loading}
                loaderPosition="center"
                onClick={async () => {
                  try {
                    setLoading(true);
                    console.log("fetching voting process info..");
                    const info = await vocdoniSDK.fetchElection(lastElectionId);
                    console.log(info); // shows election information and metadata
                  } catch (error) {
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Fetch results
              </Button> */}
            </Flex>
          </>
        )}
      </div>
    </ClientOnly>
  );
}

/** Loop though all posts available and display them */
function Posts({ posts, context, type, replyTo, setReplyTo }) {
  /** Display posts */
  if (posts) {
    console.log("comments", posts);
    return posts.map((post, key) => {
      return (
        <Post
          post={post}
          replyTo={replyTo}
          setReplyTo={setReplyTo}
          type={type}
          showContext={context ? false : true}
          key={post.stream_id}
          isNew={post.stream_id == "none" ? true : false}
        />
      );
    });
  } else {
    return <p className="white">Loading...</p>;
  }
}
