/*
 * Script: Friend Request + Tribe
 * Personal custom version
 * Version: 1.3.0
 */

if (typeof DEBUG !== 'boolean') DEBUG = false;

var scriptConfig = {
    scriptData: {
        prefix: 'friendRequestTribe',
        name: 'Friend Request + Tribe',
        version: '1.3.0',
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


// =============================================================
// LOAD twSDK
// =============================================================

$.getScript(
    'https://twscripts.dev/scripts/twSDK.js',
    async function () {

        try {

            await twSDK.init(scriptConfig);

            const scriptInfo = twSDK.scriptInfo();

            if (twSDK.checkValidLocation('screen')) {

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

            alert('Erro ao carregar o twSDK.');
        }


        // =========================================================
        // MAIN
        // =========================================================

        async function initMain() {

            // Player data
            const players =
                await twSDK.worldDataAPI('player');


            // Tribe data
            const tribeMap =
                await fetchTribeMap();


            // Current friends
            const currentFriends =
                fetchCurrentFriendsList();


            // Sort by rank
            const sortedPlayers =
                players.sort(
                    (a, b) => a[5] - b[5]
                );


            // IDs of existing friends
            const currentFriendIds =
                currentFriends.map(
                    friend => parseInt(friend.id)
                );


            // Mark existing friends
            sortedPlayers.forEach(
                player => {

                    player.push(
                        currentFriendIds.includes(
                            parseInt(player[0])
                        )
                    );
                }
            );


            // Build table
            const playersTable =
                buildPlayersTable(
                    sortedPlayers,
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


            twSDK.renderFixedWidget(
                content,
                'friendRequestTribe',
                'friend-request-tribe',
                customStyle,
                '650px'
            );


            onClickAddFriend();
        }


        // =========================================================
        // LOAD /map/ally.txt
        // =========================================================

        async function fetchTribeMap() {

            const tribeMap = new Map();

            const url =
                `${window.location.origin}/map/ally.txt`;


            try {

                const data =
                    await jQuery.get(url);


                const lines =
                    data.trim().split(/\r?\n/);


                lines.forEach(
                    line => {

                        if (!line.trim()) {
                            return;
                        }


                        /*
                         * ally.txt:
                         *
                         * [0] Tribe ID
                         * [1] Tribe Name
                         * [2] Tribe TAG
                         * [3] Members
                         * [4] Villages
                         * [5] Points
                         * [6] All Points
                         * [7] Rank
                         */


                        const fields =
                            line.split(',');


                        const tribeId =
                            parseInt(
                                fields[0]
                            );


                        const tribeTag =
                            fields[2];


                        if (
                            !isNaN(tribeId) &&
                            tribeTag
                        ) {

                            tribeMap.set(
                                tribeId,
                                decodeTWString(
                                    tribeTag
                                )
                            );
                        }
                    }
                );


                console.log(
                    'Friend Request + Tribe - Tribe Map:',
                    tribeMap
                );


            } catch (error) {

                console.error(
                    'Erro ao carregar /map/ally.txt:',
                    error
                );
            }


            return tribeMap;
        }


        // =========================================================
        // DECODE TRIBAL WARS TEXT
        // =========================================================

        function decodeTWString(value) {

            if (!value) {
                return '';
            }


            try {

                return decodeURIComponent(
                    value.replace(/\+/g, ' ')
                );

            } catch (error) {

                return value;
            }
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

            let html = `
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
                player => {

                    const [
                        id,
                        name,
                        tribeId,
                        villages,
                        points,
                        rank,
                        existing
                    ] = player;


                    if (
                        name === undefined ||
                        !id
                    ) {
                        return;
                    }


                    /*
                     * IMPORTANT:
                     *
                     * player.txt gives us the Tribe ID.
                     *
                     * Example:
                     *
                     * DeeJay -> 40
                     *
                     * We use that ID to search tribeMap.
                     *
                     * 40 -> KZD.
                     */


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


                    html += `

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

                                    data-href="/game.php?screen=info_player&id=${id}&action=add_friend&h=${game_data.csrf}"
                                >
                                    ${twSDK.tt(
                                        'Add as friend'
                                    )}
                                </span>

                            </td>

                        </tr>
                    `;
                }
            );


            html += `
                    </tbody>
                </table>
            `;


            return html;
        }


        // =========================================================
        // CURRENT FRIENDS
        // =========================================================

        function fetchCurrentFriendsList() {

            const currentFriends = [];


            const currentFriendsTable =
                jQuery(
                    '#content_value > table:nth-child(6) > tbody > tr'
                ).not(':eq(0)');


            const friendRequestsTable =
                jQuery(
                    '#content_value > table:nth-child(8) > tbody > tr'
                ).not(':eq(0)');


            const incomingFriendsTable =
                jQuery(
                    '#content_value > table:nth-child(10) > tbody > tr'
                ).not(':eq(0)');


            // Current friends
            currentFriendsTable.each(
                function () {

                    const link =
                        jQuery(this)
                            .find('td:eq(1) a')
                            .attr('href');


                    if (!link) {
                        return;
                    }


                    const id =
                        twSDK.getParameterByName(
                            'id',
                            window.location.origin + link
                        );


                    currentFriends.push({
                        id: parseInt(id),
                    });
                }
            );


            // Sent requests
            friendRequestsTable.each(
                function () {

                    const link =
                        jQuery(this)
                            .find('td:eq(0) a')
                            .attr('href');


                    if (!link) {
                        return;
                    }


                    const id =
                        twSDK.getParameterByName(
                            'id',
                            window.location.origin + link
                        );


                    currentFriends.push({
                        id: parseInt(id),
                    });
                }
            );


            // Incoming requests
            incomingFriendsTable.each(
                function () {

                    const link =
                        jQuery(this)
                            .find('td:eq(0) a')
                            .attr('href');


                    if (!link) {
                        return;
                    }


                    const id =
                        twSDK.getParameterByName(
                            'id',
                            window.location.origin + link
                        );


                    currentFriends.push({
                        id: parseInt(id),
                    });
                }
            );


            return currentFriends;
        }

    }
);
