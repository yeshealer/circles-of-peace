import React, { useState, useEffect, useRef, useContext } from "react";
import "../styles/globals.css";
import "../styles/utilities.css";
import "../styles/responsive.css";
import styles from "../styles/Home.module.css";
import Head from "next/head";
import { useRouter } from "next/router";

/** Import some Orbis modules */
import { Navigation } from "../components/Navigation";
import { CreateChannelModal } from "../components/modals/CreateChannel";
import { UpdateChannelModal } from "../components/modals/UpdateChannel";
import { UpdateGroupModal } from "../components/modals/UpdateGroup";

/** Import Context */
import { GlobalContext, ModalsContext } from "../contexts/GlobalContext";

/** Import Orbis SDK */
import { Orbis } from "@orbisclub/orbis-sdk";

/** Import TimeAgo globally */
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en.json";
en.long.minute = {
  current: "this minute",
  future: { one: "{0} min.", other: "{0} min." },
  past: { one: "{0} min. ago", other: "{0} mins. ago" },
};
TimeAgo.addDefaultLocale(en);

/** Import Wagmi */
import { WagmiConfig, createClient, configureChains, mainnet } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'

const { chains, provider, webSocketProvider } = configureChains(
  [mainnet],
  [publicProvider()]
);

const client = createClient({
  autoConnect: true,
  provider,
  webSocketProvider,
});

/** Initiate the Orbis class object */
let orbis = new Orbis();

/** Update this group id to display a new group */
const GROUP_ID =
  "kjzl6cwe1jw147jurloxh41cderszpog6t2bho8kwoa90jfvj9dk0z930oykndk";

let tempCallback;

/** Global App component */
function App({ Component, pageProps }) {
  const [user, setUser] = useState(null);
  const group_id = GROUP_ID;
  const [tempModalData, setTempModalData] = useState();
  const [navigationVis, setNavigationVis] = useState(false);
  const [createGroupModalVis, setCreateGroupModalVis] = useState(false);
  const [updateGroupModalVis, setUpdateGroupModalVis] = useState(false);
  const [updateProfileModalVis, setUpdateProfileModalVis] = useState(false);
  const [createChannelModalVisible, setCreateChannelModalVisible] =
    useState(false);
  const [updateChannelModalVisible, setUpdateChannelModalVisible] =
    useState(false);

  /** Once user is connected we load the user groups */
  useEffect(() => {
    if (!user) {
      checkUserIsConnected();
    }
  }, [user]);

  /** We call this function on launch to see if the user has an existing Ceramic session. */
  async function checkUserIsConnected() {
    let res = await orbis.isConnected();

    /** If SDK returns user details we save it in state */
    if (res && res.status == 200) {
      setUser(res.details);
    }
  }

  /** Handler to also set `group_id` in addition to the visibility state */
  function setModalVis(type, vis, data, callback) {
    /** Set visibility of the good modal type */
    switch (type) {
      case "create-channel":
        setCreateChannelModalVisible(vis);
        break;
      case "update-channel":
        setUpdateChannelModalVisible(vis);
        break;
      case "create-group":
        setCreateGroupModalVis(vis);
        break;
      case "update-group":
        setUpdateGroupModalVis(vis);
        break;
      case "update-profile":
        setUpdateProfileModalVis(vis);
        break;
      case "navigation":
        setNavigationVis(vis);
        break;
      default:
    }

    /** Save temporary data and callback function (there is probably better ways to manage this) */
    if (data) {
      setTempModalData(data);
    }

    tempCallback = callback;
  }

  return (
    <>
      <Head>
        <title key="title">Circles of Peace for +Impact</title>
        <meta
          name="description"
          content="Peace, is a start: Circles of Peace for +Impact, is a gateway to individually and collectively imaginable and achievable, Inner and Sustainable Development Goals"
          key="description"
        ></meta>
        <meta
          property="og:title"
          content="Circles of Peace for +Impact"
          key="og_title"
        />
        <meta
          property="og:description"
          content="Peace, is a start: Circles of Peace for +Impact, is a gateway to individually and collectively imaginable and achievable, Inner and Sustainable Development Goals"
          key="og_description"
        />
        <meta name="twitter:site" content="@demoversal" />
        <meta name="twitter:card" content="app" />
        <link rel="icon" href="/favicon.png" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <WagmiConfig client={client}>
        <GlobalContext.Provider value={{ user, setUser, group_id, orbis }}>
          <ModalsContext.Provider value={{ setModalVis, navigationVis }}>
            <div className={styles.container}>
              {/** Show navigation on every pages */}
              <Navigation />

              {/** Show page content */}
              <Component {...pageProps} />
            </div>
          </ModalsContext.Provider>

          {/** Show modals component that should be available at the global level */}
          <ModalsContext.Provider value={{ setModalVis }}>
            {/** Modal to edit an existing group */}
            {updateGroupModalVis && (
              <UpdateGroupModal
                visible={true}
                setVisible={() => setModalVis("update-group", false)}
                group={tempModalData}
                callback={tempCallback}
              />
            )}

            {/** Modal to create a new channel */}
            {createChannelModalVisible && (
              <CreateChannelModal
                visible={true}
                setVisible={() => setModalVis("create-channel", false)}
                group={tempModalData}
                callback={tempCallback}
              />
            )}

            {/** Modal to update a new channel */}
            {updateChannelModalVisible && (
              <UpdateChannelModal
                visible={true}
                setVisible={() => setModalVis("update-channel", false)}
                channel={tempModalData}
                callback={tempCallback}
              />
            )}
          </ModalsContext.Provider>
        </GlobalContext.Provider>
      </WagmiConfig>
    </>
  );
}

export default App;
