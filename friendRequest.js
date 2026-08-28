/*
 * Script: Friend Request + Tribe
 * Personal custom version
 */

// User Input
if (typeof DEBUG !== 'boolean') DEBUG = false;

// Script Config
var scriptConfig = {
    scriptData: {
        prefix: 'friendRequestTribe',
        name: 'Friend Request + Tribe',
        version: '1.1.0',
        author: 'Personal Mod',
        helpLink: '',
    },

    translations: {
        en_DK: {
            'Friend Request + Tribe': 'Friend Request + Tribe',
            Help: 'Help',
            'Fetching world data ...': 'Fetching world data ...',
            Rank: 'Rank',
            Player: 'Player',
            Tribe: 'Tribe',
            Villages: 'Villages',
            Points: 'Points',
            Action: 'Action',
            'Add as friend': 'Add as friend',
            'There was an error fetching the friends list!':
                'There was an error fetching the friends list!',
            'Redirecting...': 'Redirecting...',
            'There was an error!': 'There was an error!',
        },
    },

    allowedMarkets: [],
    allowedScreens: ['buddies'],
    allowedModes: [],
    isDebug: DEBUG,
    enableCountApi: true,
};

// Load twSDK
$.getScript(
    'https://twscripts.dev/scripts/twSDK.js',
    async function () {

        try {

            // Initialize Library
            await twSDK.init(scriptConfig);

            const scriptInfo = twSDK.scriptInfo();
            const isValidScreen =
                twSDK.checkValidLocation('screen');

            if (isValidScreen) {

                try {
                    await initMain();

                } catch (error) {

                    UI.ErrorMessage(
                        twSDK.tt('There was an error!')
                    );

                    console.error(
                        `${scriptInfo} Error:`,
                        error
                    );
                }

            } else {

                UI.InfoMessage(
                    twSDK.tt('Redirecting...')
                );

                twSDK.redirectTo('buddies');
            }

        } catch (error) {

            console.error(
                'Friend Request + Tribe Error:',
                error
            );

            alert(
                'Erro ao carregar o twSDK.'
            );
        }


        // =========================================================
        // MAIN
        // =========================================================

        async function initMain() {

            // Fetch players
            const players =
                await twSDK.worldDataAPI('player');

            // Fetch tribes
            const allies =
                await twSDK.worldDataAPI('ally');

            // Fetch current friends
            const currentFriends =
                fetchCurrentFriendsList();


            // -----------------------------------------------------
            // Create Tribe ID -> Tribe TAG map
            // -----------------------------------------------------

            const tribeMap = new Map();

            allies.forEach((ally) => {

                const tribeId =
                    parseInt(ally[0]);

                const tribeTag =
                    ally[2];

                if (
                    !isNaN(tribeId) &&
                    tribeTag
                ) {

                    tribeMap.set(
                        tribeId,
                        tribeTag
                    );
                }
            });


            // Sort players by rank
            const sortedPlayersByRank =
                players.sort(
                    (a, b) => a[5] - b[5]
                );


            // Current friend IDs
            const currentFriendIds =
                currentFriends.map(
                    (friend) =>
                        parseInt(friend.id)
                );


            // Mark existing friends
            const filteredPlayers =
                sortedPlayersByRank.filter(
                    (player) =>
                        player.push(
                            currentFriendIds.includes(
                                parseInt(player[0])
                            )
                        )
                );


            // Build table
            const playersTable =
                buildPlayersTable(
                    filteredPlayers,
                    tribeMap
                );


            const content = `
                <div class="ra-mb15 ra-mh400">
                    ${playersTable}
                </div>
            `;


            const customStyle = `
                .ra-mh400 {
                    overflow-y: auto;
                    max-height: 500px;
                }

                .ra-existing-player td {
                    background-color: #ffca6a !important;
                }

                .btn-confirm-yes {
                    padding: 3px;
                }
            `;


            // Render widget
            twSDK.renderFixedWidget(
                content,
                'friendRequestTribe',
                'friend-request-tribe',
                customStyle,
                '650px'
            );


            // Register buttons
            onClickAddFriend();
        }


        // =========================================================
        // ADD FRIEND
        // =========================================================

        function onClickAddFriend() {

            jQuery('.btn-add-friend').on(
                'click',
                function () {

                    const addFriendLink =
                        jQuery(this).attr(
                            'data-href'
                        );


                    jQuery(this).addClass(
                        'btn-confirm-yes'
                    );


                    jQuery('.btn-add-friend').attr(
                        'disabled',
                        'disabled'
                    );


                    setTimeout(
                        () => {

                            jQuery('.btn-add-friend')
                                .removeAttr(
                                    'disabled'
                                );

                        },
                        twSDK.delayBetweenRequests
                    );


                    jQuery.get(
                        addFriendLink
                    );
                }
            );
        }


        // =========================================================
        // BUILD TABLE
        // =========================================================

        function buildPlayersTable(
            players,
            tribeMap
        ) {

            let playersTable = `
                <table
                    class="ra-table"
                    width="100%"
                >

                    <thead>

                        <tr>

                            <th>
                                ${twSDK.tt('Rank')}
                            </th>

                            <th class="ra-tal">
                                ${twSDK.tt('Player')}
                            </th>

                            <th class="ra-tal">
                                ${twSDK.tt('Tribe')}
                            </th>

                            <th>
                                ${twSDK.tt('Villages')}
                            </th>

                            <th>
                                ${twSDK.tt('Points')}
                            </th>

                            <th>
                                ${twSDK.tt('Action')}
                            </th>

                        </tr>

                    </thead>

                    <tbody>
            `;


            players.forEach(
                (player) => {

                    /*
                     * Player data:
                     *
                     * [0] ID
                     * [1] Name
                     * [2] Tribe ID
                     * [3] Villages
                     * [4] Points
                     * [5] Rank
                     * [6] Existing friend
                     */

                    const [
                        id,
                        name,
                        tribeId,
                        villages,
                        points,
                        rank,
                        existing
                    ] = player;


                    const hash =
                        game_data.csrf;


                    if (
                        name !== undefined &&
                        id
                    ) {

                        // -------------------------------------------------
                        // Convert Tribe ID -> Tribe TAG
                        // -------------------------------------------------

                        const tribeTag =
                            tribeMap.get(
                                parseInt(tribeId)
                            );


                        let tribeHtml = '-';


                        if (tribeTag) {

                            tribeHtml = `
                                <a
                                    href="/game.php?screen=info_ally&tag=${encodeURIComponent(
                                        tribeTag
                                    )}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    ${twSDK.cleanString(
                                        tribeTag
                                    )}
                                </a>
                            `;
                        }


                        playersTable += `

                            <tr
                                class="${
                                    existing
                                        ? 'ra-existing-player'
                                        : ''
                                }"
                            >

                                <td>
                                    ${rank}
                                </td>


                                <td class="ra-tal">

                                    <a
                                        href="/game.php?screen=info_player&id=${id}"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        ${twSDK.cleanString(
                                            name
                                        )}
                                    </a>

                                </td>


                                <td class="ra-tal">
                                    ${tribeHtml}
                                </td>


                                <td>
                                    ${twSDK.formatAsNumber(
                                        villages
                                    )}
                                </td>


                                <td>
                                    ${twSDK.formatAsNumber(
                                        points
                                    )}
                                </td>


                                <td>

                                    <span
                                        class="
                                            btn
                                            btn-add-friend
                                            ${
                                                existing
                                                    ? 'btn-disabled'
                                                    : ''
                                            }
                                        "

                                        data-href="/game.php?screen=info_player&id=${id}&action=add_friend&h=${hash}"
                                    >
                                        ${twSDK.tt(
                                            'Add as friend'
                                        )}
                                    </span>

                                </td>

                            </tr>
                        `;
                    }
                }
            );


            playersTable += `
                    </tbody>

                </table>
            `;


            return playersTable;
        }


        // =========================================================
        // CURRENT FRIENDS
        // =========================================================

        function fetchCurrentFriendsList() {

            const currentFriends = [];


            // Current friends
            const currentFriendsTable =
                jQuery(
                    '#content_value > table:nth-child(6) > tbody > tr'
                ).not(':eq(0)');


            // Sent requests
            const friendRequestsTable =
                jQuery(
                    '#content_value > table:nth-child(8) > tbody > tr'
                ).not(':eq(0)');


            // Incoming requests
            const incomingFriendsTable =
                jQuery(
                    '#content_value > table:nth-child(10) > tbody > tr'
                ).not(':eq(0)');


            // -----------------------------------------------------
            // Current friends
            // -----------------------------------------------------

            currentFriendsTable.each(
                function () {

                    const playerName =
                        jQuery(this)
                            .find('td:eq(1)')
                            .text()
                            .trim();


                    const playerLink =
                        jQuery(this)
                            .find('td:eq(1) a')
                            .attr('href');


                    if (!playerLink) return;


                    const playerId =
                        twSDK.getParameterByName(
                            'id',
                            window.location.origin +
                                playerLink
                        );


                    currentFriends.push({

                        id: parseInt(playerId),

                        name: playerName,

                    });
                }
            );


            // -----------------------------------------------------
            // Sent requests
            // -----------------------------------------------------

            friendRequestsTable.each(
                function () {

                    const playerName =
                        jQuery(this)
                            .find('td:eq(0)')
                            .text()
                            .trim();


                    const playerLink =
                        jQuery(this)
                            .find('td:eq(0) a')
                            .attr('href');


                    if (!playerLink) return;


                    const playerId =
                        twSDK.getParameterByName(
                            'id',
                            window.location.origin +
                                playerLink
                        );


                    currentFriends.push({

                        id: parseInt(playerId),

                        name: playerName,

                    });
                }
            );


            // -----------------------------------------------------
            // Incoming requests
            // -----------------------------------------------------

            incomingFriendsTable.each(
                function () {

                    const playerName =
                        jQuery(this)
                            .find('td:eq(0)')
                            .text()
                            .trim();


                    const playerLink =
                        jQuery(this)
                            .find('td:eq(0) a')
                            .attr('href');


                    if (!playerLink) return;


                    const playerId =
                        twSDK.getParameterByName(
                            'id',
                            window.location.origin +
                                playerLink
                        );


                    currentFriends.push({

                        id: parseInt(playerId),

                        name: playerName,

                    });
                }
            );


            return currentFriends;
        }

    }
);
