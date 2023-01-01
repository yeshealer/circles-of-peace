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
  Tooltip,
  Anchor,
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
// import { scheduleJob } from "node-schedule";
import { createGroup } from "../utils/create-group";
import { id } from "ethers/lib/utils.js";

const ActiveElectionId =
  "c5d2460186f7ed2ef70e8b1ebf95bdfd7ba692454143b2a8263b020000000018";

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
  const [scheduledJobDate, setScheduledJobDate] = useState();
  const [mostVotedCauseIndex, setMostVotedCauseIndex] = useState();

  //https://www.npmjs.com/package/node-schedule
  // const date = new Date(2012, 11, 21, 5, 30, 0);
  // const [electionEndDate, setElectionEndDate] = useState({
  //   year: null,
  //   month: null,
  //   day: null,
  //   hour: null,
  //   minute: null,
  //   second: null,
  // });

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

  // const makeDateFrom = (end) => {
  //   return {
  //     new Date()
  //     year: end.getFullYear(),
  //     month: end.getMonth(),
  //     day: end.getDay(),
  //     hour: end.getHours(),
  //     minute: end.getMinutes() + 10,
  //     second: end.getSeconds(),
  //   };
  // };

  const getVoteCounts = (info) => {
    let resultsArrInt = [];
    let resultsArr = info._results[0]; // this returns an array of strings
    resultsArr.map((voteCount, index) => {
      resultsArrInt.push(parseInt(voteCount));
    });
    return resultsArr;
  };

  const findMostVoted = (info) => {
    let resultsArrInt = [];
    let resultsArr = info._results[0]; // this returns an array of strings
    resultsArr.map((voteCount, index) => {
      resultsArrInt.push(parseInt(voteCount));
    });
    // console.log(`resultsArrInt after pushing all: ${resultsArrInt}`);
    // console.log(
    //   `length resultsArrInt after pushing all: ${resultsArrInt.length}`
    // );

    let highest = Math.max(...resultsArrInt); // find the one with max value.
    // console.log(`highest in resultsArrInt: ${highest}`);
    // console.log(`STRhighest in resultsArrInt: ${highest.toString()}`);

    // console.log(
    //   `index of highest vote: ${resultsArr.indexOf(highest.toString())}`
    // );

    return resultsArr.indexOf(highest.toString());
  };

  const isEqualTo = (elem, highest) => elem == highest;

  const scheduleGroupCreation = (groupCreationDate) => {
    console.log(`scheduling for: ${JSON.stringify(groupCreationDate)}`);

    // for scheduler, format should be like this:
    // const date = new Date(2012, 11, 21, 5, 30, 0);
    scheduleJob(groupCreationDate, async function () {
      // get election results and build content
      let content = { name: "", description: "", pfp: "" };

      const info = await vocdoniSDK.fetchElection(ActiveElectionId);
      let mostVotedIndex = findMostVoted(info);

      content.name = causes[mostVotedIndex].name;
      content.pfp = causes[mostVotedIndex].imgUrl;
      content.description = "";

      console.log(
        `creating group @ scheduled function: ${JSON.stringify(content)}`
      );
      createGroup(content); // pass to create-group util
    });
  };

  // form to create census + add voters from orbis get joined
  const createCensus = async () => {
    const census = new PlainCensus();
    census.add(members);

    console.log("🚀 ~ file: Voting.js:85 ~ createCensus ~ census", census);

    return census;
  };

  const createElection = (census) => {
    const endDate = new Date();

    endDate.setHours(endDate.getHours() + 48); // two days
    // endDate.setMinutes(endDate.getMinutes() + 2);
    // TODO: add automated group creation

    // let groupCreationDate = new Date();
    // groupCreationDate.setMinutes(endDate.getMinutes() + 3);
    // console.log(`groupCreationDate: ${groupCreationDate}`);
    // setScheduledJobDate(groupCreationDate);
    const election = Election.from({
      title: "Impact Next",
      description: "Peacemaker! If peace is a start, then what's next?",
      header: "https://source.unsplash.com/random",
      streamUri: "https://source.unsplash.com/random",
      endDate: endDate.getTime(),
      census,
      electionType: null,
    });

    election.addQuestion("Peace, is a start", "What to impact next?", [
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
      { title: "Partnerships for the Goals", value: 15 },
    ]);
    return election;
  };

  const voteElection = async (value) => {
    // if(electionEndDate < Date.now()) {
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
    // } else {
    //   alert("This round of \"Impact Next\" is over. See you in the next one!")

    // }
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
            <Flex
              direction={"column"}
              align="center"
              style={{ paddingBloxk: "2rem" }}
            >
              <Card shadow="md" p="xl" radius="md" withBorder>
                <Title order={3}>
                  {activeElectionInfo._questions[0].title.default}
                </Title>
                <Text fz="lg" style={{ marginBottom: "2rem" }}>
                  {activeElectionInfo._questions[0].description.default}
                </Text>

                <Flex direction={"row"} gap={"md"}>
                  <Text style={{ color: "white", fontSize: "1.2rem" }}>
                    Election started{" "}
                    <ReactTimeAgo
                      date={activeElectionInfo._startDate}
                      locale="en-US"
                    />
                  </Text>
                  &
                  <Text style={{ color: "white", fontSize: "1.2rem" }}>
                    {activeElectionInfo._endDate < Date.now() ? (
                      <>ended</>
                    ) : (
                      <>ends</>
                    )}{" "}
                    {""}
                    <ReactTimeAgo
                      date={activeElectionInfo._endDate}
                      locale="en-US"
                    />
                    .
                  </Text>
                </Flex>

                <br></br>
                {activeElectionInfo._endDate < Date.now() &&
                !activeElectionInfo._voteCount == 0 ? (
                  <>
                    <Text
                      style={{
                        fontSize: "1.4rem",
                        marginBottom: "2rem",
                        marginTop: "2rem",
                      }}
                    >
                      {" "}
                      With {activeElectionInfo._voteCount} votes,{" "}
                      <strong>
                        {causes[findMostVoted(activeElectionInfo)].name}
                      </strong>{" "}
                      is most wanted to be next cause to start a group here.
                    </Text>
                    <Tooltip.Floating
                      multiline
                      width={200}
                      label={
                        causes[findMostVoted(activeElectionInfo)].name +
                        " : " +
                        getVoteCounts(activeElectionInfo)[
                          findMostVoted(activeElectionInfo)
                        ] +
                        " votes"
                      }
                      color="dark"
                      style={{ fontSize: "1.8rem" }}
                    >
                      <img
                        width={120}
                        height={120}
                        src={causes[findMostVoted(activeElectionInfo)].imgUrl}
                        style={{ borderRadius: "20%" }}
                      ></img>
                      {/* </Button> */}
                    </Tooltip.Floating>

                    <Text
                      style={{
                        fontSize: "1.4rem",
                        marginBottom: "2rem",
                        marginTop: "2rem",
                      }}
                    >
                      Learn more about this Sustainable Development Goal @{" "}
                      <Anchor
                        href={
                          "https://sdgs.un.org/goals/goal" +
                          (findMostVoted(activeElectionInfo) + 1).toString()
                        }
                        target="_blank"
                      >
                        United Nations
                      </Anchor>{" "}
                      and{" "}
                      <Anchor
                        href={
                          "https://en.wikipedia.org/wiki/Sustainable_Development_Goal_" +
                          (findMostVoted(activeElectionInfo) + 1).toString()
                        }
                        target="_blank"
                      >
                        Wikipedia
                      </Anchor>
                      .
                    </Text>
                  </>
                ) : null}
              </Card>
            </Flex>
            {/* <div style={{ backgroundColor: "gray" }}>
              <VotingStats
                causes={activeElectionInfo._questions[0].choices}
                results={activeElectionInfo.results[0]}
              />
            </div> */}

            {activeElectionInfo._endDate < Date.now() ? (
              //  null
              <SimpleGrid size="xxl" cols={4}>
                {isConnected &&
                  activeElectionInfo._questions[0].choices.map(
                    (choice, index) => (
                      <>
                        <Tooltip.Floating
                          multiline
                          width={200}
                          label={
                            causes[index].name +
                            " : " +
                            getVoteCounts(activeElectionInfo)[index] +
                            " votes"
                          }
                          color="dark"
                          style={{ fontSize: "1.8rem" }}
                        >
                          <img
                            width={120}
                            height={120}
                            src={causes[choice.value].imgUrl}
                            onClick={() => voteElection(choice.value)}
                            style={{ borderRadius: "20%" }}
                          ></img>
                          {/* </Button> */}
                        </Tooltip.Floating>
                      </>
                    )
                  )}
              </SimpleGrid>
            ) : (
              <SimpleGrid size="xxl" cols={4}>
                {isConnected &&
                  activeElectionInfo._questions[0].choices.map(
                    (choice, index) => (
                      <>
                        <Tooltip.Floating
                          multiline
                          width={200}
                          label={causes[choice.value].name}
                          color="dark"
                          style={{ fontSize: "1.8rem" }}
                        >
                          <img
                            width={120}
                            height={120}
                            src={causes[choice.value].imgUrl}
                            onClick={() => voteElection(choice.value)}
                            style={{ borderRadius: "20%" }}
                          ></img>
                          {/* </Button> */}
                        </Tooltip.Floating>
                      </>
                    )
                  )}
              </SimpleGrid>
            )}

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
                    // election.endDate returns in this format:
                    //Sat Dec 31 2022 09:19:16 GMT+0300 (GMT+03:00)

                    // scheduleGroupCreation(scheduledJobDate);

                    console.log(
                      `election EndDate after creation: ${election.endDate}`
                    );

                    console.log(`scheduled time: ${scheduledJobDate}`);

                    //const date = new Date(2012, 11, 21, 5, 30, 0);
                    console.log(`sent the endDate to scheduleGroupCreation`);
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
