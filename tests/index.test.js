// STANDARD STATUS CODES:
// access to authenticated endpoint without authorisation / unauthorised access to protected route = 403 (standard)

/**********V.V.V.V.V. Important NOTE***********/
/* Initially tests were failing bcoz jab bhi koi aur status return hota hai 200 (for successful request) ke ilava unsuccessful api request ke kaaran toh axios error throw krta hai but error handling ke liye try-catch nhi lga hua tha and fetch bhi nhi use kiya jo ki error nhi deta unsuccessful request pe toh ya toh sabko fetch mein change krna padta ya fir sabmein try catch lgana padta toh uski bajaaye ek smart solution hai khud ka ek wrapper (custom) axios bna liya jo under the hood original axios ko use krke api calls maarega bs jab bhi agr error aaega toh voh error ka response return krdega nhi toh sahi response return krdega */

const axios2 = require("axios");

const BACKEND_URL = "http://localhost:3000"
const WS_URL = "ws://localhost:3001"

const axios = {
    post: async (...args) => {
        try {
            const res = await axios2.post(...args);
            // console.log("successful response", res.status);
            return res;
        } catch (error) {
            // console.log("unsuccessful response", error);
            return error.response;
        }
    },
    get: async (...args) => {
        try {
            const res = await axios2.get(...args);
            return res;
        } catch (error) {
            // console.log(error);
            return error.response;
        }
    },
    put: async (...args) => {
        try {
            const res = await axios2.put(...args);
            return res;
        } catch (error) {
            // console.log(error);
            return error.response;
        }
    },
    delete: async (...args) => {
        try {
            const res = await axios2.delete(...args);
            return res;
        } catch (error) {
            // console.log(error);
            return error.response;
        }
    }
}

describe("Authentication", () => {

    test("User is able to signup only once", async () => {
        const username = "Rehan" + Math.random(); // Rehan0.323435
        const password = "TESTtest@123";

        const response = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            type: "admin"
        })
        expect(response.status).toBe(200);
        expect(response.data.userId).toBeDefined();

        const updatedResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            type: "admin"
        })
        expect(updatedResponse.status).toBe(400);
    });

    test("User is not able to signup if username is empty", async () => {
        const username = `Rehan-${Math.random()}`;
        const password = "TESTtest@123";

        const response = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            password,
            type: "user"
        })
        expect(response.status).toBe(400);
    });

    test("Signin succeeds if username and password are correct", async () => {
        const username = "Rehan" + Math.random();
        const password = "TESTtest@123";

        await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            type: "admin"
        })

        const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username,
            password
        })

        expect(response.status).toBe(200);
        expect(response.data.token).toBeDefined();
    })

    test("Signin fails if username and password are incorrect", async () => {
        const username = `Rehan_${Math.random()}`;
        const password = "TESTtest@123";

        await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            type: "user"
        });

        const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: "WrongUsername",
            password
        });

        expect(response.status).toBe(403);
    })
})

describe("User metadata endpoint", () => {
    // all endpoints are protected i.e. user needs to be signed in first to access these apis.
    // so for every test case we have to signup signin again and again. so instead we signin once
    // and use that token for all the test cases.

    let token = "";
    let avatarId = "";

    beforeAll(async () => {
        const username = `Rehan${Math.random()}`;
        const password = "TESTtest@123";

        await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            type: "admin"
        });

        const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username,
            password
        });
        token = response.data.token;

        const avatarResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/avatar`,
            {
                imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
                name: "Johnny"
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
        avatarId = avatarResponse.data.avatarId;
    });

    test("User cant update their metadata with a wrong avatarId", async () => {
        const response = await axios.post(`${BACKEND_URL}/api/v1/user/metadata`,
            {
                avatarId: "1234135465367"
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

        expect(response.status).toBe(400);
    });

    test("User can update their metadata with the right avatarId", async () => {
        // console.log("avatarId", avatarId);
        const response = await axios.post(`${BACKEND_URL}/api/v1/user/metadata`, {
            avatarId
        },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

        expect(response.status).toBe(200);
    });

    test("User is not able to update their metadata if auth header is not sent", async () => {
        const response = await axios.post(`${BACKEND_URL}/api/v1/user/metadata`, {
            avatarId
        });

        expect(response.status).toBe(403);
    });
})

describe("User avatar information", () => {
    let token;
    let avatarId;
    let userId;

    beforeAll(async () => {
        const username = `Rehan${Math.random()}`;
        const password = "TESTtest@123";

        const signupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            type: "admin"
        });
        userId = signupResponse.data.userId;

        const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username,
            password
        });
        token = response.data.token;

        const avatarResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/avatar`,
            {
                imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
                name: "Johnny"
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
        avatarId = avatarResponse.data.avatarId;
    });

    test("Get back avatar information for a user", async () => {
        const response = await axios.get(`${BACKEND_URL}/api/v1/user/metadata/bulk?ids=[${userId}]`);
        // console.log(response.data);

        expect(response.data.avatars.length).toBe(1);
        expect(response.data.avatars[0].userId).toBe(userId);
    });

    test("Available avatars lists the currently created avatars", async () => {
        const response = await axios.get(`${BACKEND_URL}/api/v1/avatars`);

        expect(response.data.avatars.length).not.toBe(0);

        const currentAvatar = response.data.avatars.find(avatar => avatar.id === avatarId);
        expect(currentAvatar).toBeDefined();
    })
})

describe("Space information", () => {
    let adminId, adminToken;
    let userId, userToken;
    let mapId, element1Id, element2Id;

    beforeAll(async () => {
        const admin_username = `Rehan#${Math.random().toFixed(5)}-admin`;
        const password = "TESTtest@123";

        const signupAdminResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username: admin_username,
            password,
            type: "admin"
        });
        adminId = signupAdminResponse.data.userId;

        const signinAdminResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: admin_username,
            password
        });
        adminToken = signinAdminResponse.data.token;

        const user_username = `Rehan@${Math.random().toFixed(5)}-user`;

        const signupUserResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username: user_username,
            password,
            type: "user"
        });
        userId = signupUserResponse.data.userId;

        const signinUserResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: user_username,
            password
        });
        userToken = signinUserResponse.data.token;

        const createElement1Response = await axios.post(`${BACKEND_URL}/api/v1/admin/element`,
            {
                imageUrl: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
                width: 1,
                height: 1,
                static: true // weather or not the user can sit on top of this element (is it considered as a collission or not)
            },
            {
                headers: {
                    Authorization: `Bearer ${adminToken}`
                }
            });
        element1Id = createElement1Response.data.id;

        const createElement2Response = await axios.post(`${BACKEND_URL}/api/v1/admin/element`,
            {
                imageUrl: "https://i5.walmartimages.com/asr/c0ac966f-ea01-45a9-aea3-98f107f09cde_1.f73eac8a8ee4e481631b95df37a3e115.jpeg",
                width: 10,
                height: 10,
                static: false // weather or not the user can sit on top of this element (is it considered as a collission or not)
            },
            {
                headers: {
                    Authorization: `Bearer ${adminToken}`
                }
            });
        element2Id = createElement2Response.data.id;

        const createMapResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/map`,
            {
                thumbnail: "https://thumbnail.com/a.png",
                dimensions: "100x200",
                name: "100 person interview room",
                defaultElements: [
                    {
                        elementId: element1Id,
                        x: 20,
                        y: 20
                    },
                    {
                        elementId: element1Id,
                        x: 5,
                        y: 10
                    },
                    {
                        elementId: element2Id,
                        x: 18,
                        y: 20
                    }
                ]
            },
            {
                headers: {
                    Authorization: `Bearer ${adminToken}`
                }
            });
        mapId = createMapResponse.data.id;
    });

    test("User is able to create space", async () => {
        const response = await axios.post(`${BACKEND_URL}/api/v1/space`,
            {
                name: "Test",
                dimensions: "100x200",
                mapId
            },
            {
                headers: {
                    Authorization: `Bearer ${userToken}`
                }
            });

        expect(response.status).toBe(200);
        expect(response.data.spaceId).toBeDefined();
    });

    test("User is able to create space without mapId (empty space)", async () => {
        const response = await axios.post(`${BACKEND_URL}/api/v1/space`,
            {
                name: "Test",
                dimensions: "100x200",
            },
            {
                headers: {
                    Authorization: `Bearer ${userToken}`
                }
            });

        expect(response.status).toBe(200);
        expect(response.data.spaceId).toBeDefined();
    });

    test("User is not able to create space without dimensions and mapId", async () => {
        const response = await axios.post(`${BACKEND_URL}/api/v1/space`,
            {
                name: "Test",
            },
            {
                headers: {
                    Authorization: `Bearer ${userToken}`
                }
            });

        expect(response.status).toBe(400);
    });

    test("User is not able to delete a space that does not exist", async () => {
        const response = await axios.delete(`${BACKEND_URL}/api/v1/space/86896`, {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        });

        expect(response.status).toBe(400);
    });

    test("User is able to delete a space that exists", async () => {
        const response = await axios.post(`${BACKEND_URL}/api/v1/space`,
            {
                name: "Test",
                dimensions: "100x200",
                mapId
            },
            {
                headers: {
                    Authorization: `Bearer ${userToken}`
                }
            }
        );

        const deleteResponse = await axios.delete(`${BACKEND_URL}/api/v1/space/${response.data.spaceId}`, {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        });

        // console.log("Delete space successfully test case", deleteResponse.data.message);
        expect(deleteResponse.status).toBe(200);
    });

    test("User should not be able to delete a space created by some other user", async () => {
        const response = await axios.post(`${BACKEND_URL}/api/v1/space`,
            {
                name: "Test",
                dimensions: "100x200",
                mapId
            },
            {
                headers: {
                    Authorization: `Bearer ${userToken}`
                }
            }
        );

        const deleteResponse = await axios.delete(`${BACKEND_URL}/api/v1/space/${response.data.spaceId}`, {
            headers: {
                Authorization: `Bearer ${adminToken}`
            }
        });

        expect(deleteResponse.status).toBe(403);
    });

    test("Admin has no spaces initially..", async () => {
        const response = await axios.get(`${BACKEND_URL}/api/v1/space/all`, {
            headers: {
                Authorization: `Bearer ${adminToken}`
            }
        });
        expect(response.data.spaces.length).toBe(0);
    });

    test("Admin can see all of their spaces", async () => {
        const response = await axios.post(`${BACKEND_URL}/api/v1/space`,
            {
                name: "Test",
                dimensions: "100x200",
            },
            {
                headers: {
                    Authorization: `Bearer ${adminToken}`
                }
            })

        const getAllSpacesResponse = await axios.get(`${BACKEND_URL}/api/v1/space/all`, {
            headers: {
                Authorization: `Bearer ${adminToken}`
            }
        });

        expect(getAllSpacesResponse.data.spaces.length).toBe(1);
        const filteredSpace = getAllSpacesResponse.data.spaces.find(space => space.id === response.data.spaceId);
        expect(filteredSpace).toBeDefined();
    });
})

describe("Arena endpoints", () => {
    let adminId, adminToken;
    let userId, userToken;
    let mapId, element1Id, element2Id;
    let spaceId;

    beforeAll(async () => {
        const admin_username = `Rehan#${Math.random()}`;
        const password = "TESTtest@123";

        const signupAdminResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username: admin_username,
            password,
            type: "admin"
        });
        adminId = signupAdminResponse.data.userId;

        const signinAdminResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: admin_username,
            password
        });
        adminToken = signinAdminResponse.data.token;

        const user_username = `Rehan@${Math.random()}`;

        const signupUserResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username: user_username,
            password,
            type: "user"
        });
        userId = signupUserResponse.data.userId;

        const signinUserResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: user_username,
            password
        });
        userToken = signinUserResponse.data.token;

        const createElement1Response = await axios.post(`${BACKEND_URL}/api/v1/admin/element`,
            {
                imageUrl: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
                width: 1,
                height: 1,
                static: true // weather or not the user can sit on top of this element (is it considered as a collission or not)
            },
            {
                headers: {
                    Authorization: `Bearer ${adminToken}`
                }
            });
        element1Id = createElement1Response.data.id;

        const createElement2Response = await axios.post(`${BACKEND_URL}/api/v1/admin/element`,
            {
                imageUrl: "https://i5.walmartimages.com/asr/c0ac966f-ea01-45a9-aea3-98f107f09cde_1.f73eac8a8ee4e481631b95df37a3e115.jpeg",
                width: 10,
                height: 10,
                static: false // weather or not the user can sit on top of this element (is it considered as a collission or not)
            },
            {
                headers: {
                    Authorization: `Bearer ${adminToken}`
                }
            });
        element2Id = createElement2Response.data.id;

        const createMapResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/map`,
            {
                thumbnail: "https://thumbnail.com/a.png",
                dimensions: "100x200",
                name: "100 person interview room",
                defaultElements: [
                    {
                        elementId: element1Id,
                        x: 20,
                        y: 20
                    },
                    {
                        elementId: element1Id,
                        x: 5,
                        y: 10
                    },
                    {
                        elementId: element2Id,
                        x: 18,
                        y: 20
                    }
                ]
            },
            {
                headers: {
                    Authorization: `Bearer ${adminToken}`
                }
            });
        mapId = createMapResponse.data.id;

        const createSpaceResponse = await axios.post(`${BACKEND_URL}/api/v1/space`,
            {
                name: "Test",
                dimensions: "100x200",
                mapId
            },
            {
                headers: {
                    Authorization: `Bearer ${userToken}`
                }
            });
        spaceId = createSpaceResponse.data.spaceId;
    });

    test("Correct spaceId returns all the elements", async () => {
        const response = await axios.get(`${BACKEND_URL}/api/v1/space/${spaceId}`, {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        });

        expect(response.status).toBe(200);
        expect(response.data.dimensions).toBe("100x200");
        expect(response.data.elements.length).toBe(3);
    });

    test("Incorrect spaceId return a 400", async () => {
        const response = await axios.get(`${BACKEND_URL}/api/v1/space/1234woidgh@25`, {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        });
        expect(response.status).toBe(400);
    });

    test("Delete endpoint is able to delete an element from the arena", async () => {
        console.log("space id", spaceId);
        const response = await axios.get(`${BACKEND_URL}/api/v1/space/${spaceId}`, {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        });

        const deleteResponse = await axios.delete(`${BACKEND_URL}/api/v1/space/element`, {
            data: { id: response.data.elements[0].id },
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        }
        );

        const newResponse = await axios.get(`${BACKEND_URL}/api/v1/space/${spaceId}`, {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        });

        expect(newResponse.data.elements.length).toBe(2);
    });

    test("Adding an element fails if element lies outside the dimensions", async () => {

        const prevResponse = await axios.get(`${BACKEND_URL}/api/v1/space/${spaceId}`, {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        });

        const response = await axios.post(`${BACKEND_URL}/api/v1/space/element`,
            {
                elementId: element1Id,
                spaceId: spaceId,
                x: 20000,
                y: 40000
            },
            {
                headers: {
                    Authorization: `Bearer ${userToken}`
                }
            });

        const newResponse = await axios.get(`${BACKEND_URL}/api/v1/space/${spaceId}`, {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        });

        expect(response.status).toBe(400);
        expect(newResponse.data.elements.length).toBe(prevResponse.data.elements.length);
    });

    test("Adding an element works as expected", async () => {
        await axios.post(`${BACKEND_URL}/api/v1/space/element`,
            {
                elementId: element1Id,
                spaceId: spaceId,
                x: 20,
                y: 40
            },
            {
                headers: {
                    Authorization: `Bearer ${userToken}`
                }
            });

        const newResponse = await axios.get(`${BACKEND_URL}/api/v1/space/${spaceId}`, {
            headers: {
                Authorization: `Bearer ${userToken}`
            }
        });

        expect(newResponse.status).toBe(200);
        expect(newResponse.data.elements.length).toBe(3);
    });
})

describe("Admin endpoints", () => {
    let adminId, adminToken;
    let userId, userToken;

    beforeAll(async () => {
        const admin_username = `Rehan#${Math.random()}`;
        const password = "TESTtest@123";

        const signupAdminResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username: admin_username,
            password,
            type: "admin"
        });
        adminId = signupAdminResponse.data.userId;

        const signinAdminResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: admin_username,
            password
        });
        adminToken = signinAdminResponse.data.token;

        const user_username = `Rehan@${Math.random()}`;

        const signupUserResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username: user_username,
            password,
            type: "user"
        });
        userId = signupUserResponse.data.userId;

        const signinUserResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: user_username,
            password
        });
        userToken = signinUserResponse.data.token;
    });

    test("User is not able to access all admin endpoints", async () => {
        const createElementResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/element`,
            {
                imageUrl: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
                width: 1,
                height: 1,
                static: true // weather or not the user can sit on top of this element (is it considered as a collission or not)
            },
            {
                headers: {
                    Authorization: `Bearer ${userToken}`
                }
            });

        const createMapResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/map`,
            {
                thumbnail: "https://thumbnail.com/a.png",
                dimensions: "100x200",
                name: "100 person interview room",
                defaultElements: []
            },
            {
                headers: {
                    Authorization: `Bearer ${userToken}`
                }
            });

        const updateElementResponse = await axios.put(`${BACKEND_URL}/api/v1/admin/element/5347856`,
            {
                imageUrl: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE"
            },
            {
                headers: {
                    Authorization: `Bearer ${userToken}`
                }
            });

        const createAvatarResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/avatar`,
            {
                imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
                name: "Johnny"
            },
            {
                headers: {
                    Authorization: `Bearer ${userToken}`
                }
            })

        expect(createElementResponse.status).toBe(403);
        expect(createMapResponse.status).toBe(403);
        expect(updateElementResponse.status).toBe(403);
        expect(createAvatarResponse.status).toBe(403);
    });

    test("Admin is able to access all admin endpoints", async () => {
        const createElementResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/element`,
            {
                imageUrl: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
                width: 1,
                height: 1,
                static: true // weather or not the user can sit on top of this element (is it considered as a collission or not)
            },
            {
                headers: {
                    Authorization: `Bearer ${adminToken}`
                }
            });

        const createMapResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/map`,
            {
                thumbnail: "https://thumbnail.com/a.png",
                dimensions: "100x200",
                name: "100 person interview room",
                defaultElements: [
                    {
                        elementId: createElementResponse.data.id,
                        x: 20,
                        y: 20
                    }
                ]
            },
            {
                headers: {
                    Authorization: `Bearer ${adminToken}`
                }
            });

        const updateElementResponse = await axios.put(`${BACKEND_URL}/api/v1/admin/element/${createElementResponse.data.id}`,
            {
                imageUrl: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE"
            },
            {
                headers: {
                    Authorization: `Bearer ${adminToken}`
                }
            });

        const createAvatarResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/avatar`,
            {
                imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
                name: "Johnny"
            },
            {
                headers: {
                    Authorization: `Bearer ${adminToken}`
                }
            })

        expect(createElementResponse.status).toBe(200);
        expect(createMapResponse.status).toBe(200);
        expect(updateElementResponse.status).toBe(200);
        expect(createAvatarResponse.status).toBe(200);
    })
})

describe("Websocket tests", () => {
    
    let adminId, adminToken;
    let userId, userToken;
    let mapId, element1Id, element2Id;
    let spaceId;
    let ws1, ws2;
    let ws1Messages = [];
    let ws2Messages = [];
    let adminX, adminY;
    let userX, userY;

    async function waitForAndPopLatestMessage(messageArray) {
        return new Promise(resolve => {
            if (messageArray.length > 0) {
                resolve(messageArray.pop());
            }
            else {
                let interval = setInterval(() => {
                    if (messageArray.length > 0) {
                        resolve(messageArray.pop());
                        clearInterval(interval)
                    }
                }, 100)
            }
        })
    }

    async function setupHTTP() {
        const admin_username = `Rehan#${Math.random()}`;
        const password = "TESTtest@123";

        const signupAdminResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username: admin_username,
            password,
            type: "admin"
        });
        adminId = signupAdminResponse.data.userId;

        const signinAdminResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: admin_username,
            password
        });
        adminToken = signinAdminResponse.data.token;

        const user_username = `Rehan@${Math.random()}`;

        const signupUserResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username: user_username,
            password,
            type: "user"
        });
        userId = signupUserResponse.data.userId;

        const signinUserResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: user_username,
            password
        });
        userToken = signinUserResponse.data.token;

        const createElement1Response = await axios.post(`${BACKEND_URL}/api/v1/admin/element`,
            {
                imageUrl: "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
                width: 1,
                height: 1,
                static: true // weather or not the user can sit on top of this element (is it considered as a collission or not)
            },
            {
                headers: {
                    Authorization: `Bearer ${adminToken}`
                }
            });
        element1Id = createElement1Response.data.id;

        const createElement2Response = await axios.post(`${BACKEND_URL}/api/v1/admin/element`,
            {
                imageUrl: "https://i5.walmartimages.com/asr/c0ac966f-ea01-45a9-aea3-98f107f09cde_1.f73eac8a8ee4e481631b95df37a3e115.jpeg",
                width: 10,
                height: 10,
                static: false // weather or not the user can sit on top of this element (is it considered as a collission or not)
            },
            {
                headers: {
                    Authorization: `Bearer ${adminToken}`
                }
            });
        element2Id = createElement2Response.data.id;

        const createMapResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/map`,
            {
                thumbnail: "https://thumbnail.com/a.png",
                dimensions: "100x200",
                name: "100 person interview room",
                defaultElements: [
                    {
                        elementId: element1Id,
                        x: 20,
                        y: 20
                    },
                    {
                        elementId: element1Id,
                        x: 5,
                        y: 10
                    },
                    {
                        elementId: element2Id,
                        x: 18,
                        y: 20
                    }
                ]
            },
            {
                headers: {
                    Authorization: `Bearer ${adminToken}`
                }
            });
        mapId = createMapResponse.data.id;

        const createSpaceResponse = await axios.post(`${BACKEND_URL}/api/v1/space`,
            {
                name: "Test",
                dimensions: "100x200",
                mapId
            },
            {
                headers: {
                    Authorization: `Bearer ${userToken}`
                }
            });
        spaceId = createSpaceResponse.data.spaceId;
    }

    async function setupWS() {
        ws1 = new WebSocket(WS_URL);
        ws2 = new WebSocket(WS_URL);

        await new Promise(resolve => {
            ws1.onopen = () => {
                console.log("Connected to WebSocket 1 successfully");
                resolve();
            }
        })

        ws1.onmessage = (event) => {
            console.log(event.data);
            ws1Messages.push(JSON.parse(event.data));
        }

        await new Promise(resolve => {
            ws2.onopen = () => {
                console.log("Connected to WebSocket 2 successfully");
                resolve();
            }
        })

        ws2.onmessage = (event) => {
            console.log(event.data);
            ws2Messages.push(JSON.parse(event.data));
        }
    }

    beforeAll(async () => {
        await setupHTTP();
        await setupWS();
    });

    test("Get back acknowledgement for joining space", async () => {
        await ws1.send(JSON.stringify({
            type: "join",
            payload: {
                spaceId: spaceId,
                token: adminToken
            }
        }));
        const message1 = await waitForAndPopLatestMessage(ws1Messages);

        await ws2.send(JSON.stringify({
            type: "join",
            payload: {
                spaceId: spaceId,
                token: userToken
            }
        }));

        const message2 = await waitForAndPopLatestMessage(ws2Messages);
        const message3 = await waitForAndPopLatestMessage(ws1Messages);

        expect(message1.type).toBe("space-joined");
        expect(message2.type).toBe("space-joined");
        expect(message1.payload.users.length).toBe(0);
        expect(message2.payload.users.length).toBe(1);

        expect(message3.type).toBe("user-join");
        expect(message3.payload.x).toBe(message2.payload.spawn.x);
        expect(message3.payload.y).toBe(message2.payload.spawn.y);
        expect(message3.payload.userId).toBe(userId);

        adminX = message1.payload.spawn.x;
        adminY = message1.payload.spawn.y;

        userX = message2.payload.spawn.x;
        userY = message2.payload.spawn.y;
    });

    test("User should not be able to move across the boundary wall", async () => {
        await ws1.send(JSON.stringify({
            type: "move",
            payload: {
                x: 10000000,
                y: 30000000
            }
        }));
        const message = await waitForAndPopLatestMessage(ws1Messages);

        expect(message.type).toBe("movement-rejected");
        expect(message.payload.x).toBe(adminX);
        expect(message.payload.y).toBe(adminY);
    });

    test("User should not be able to move two blocks at the same time", async () => {
        await ws1.send(JSON.stringify({
            type: "move",
            payload: {
                x: adminX + 2,
                y: adminY
            }
        }));

        const message = await waitForAndPopLatestMessage(ws1Messages);

        expect(message.type).toBe("movement-rejected");
        expect(message.payload.x).toBe(adminX);
        expect(message.payload.y).toBe(adminY);
    });

    test("Correct movement of user should be broadcasted to other sockets in the room", async () => {
        await ws1.send(JSON.stringify({
            type: "move",
            payload: {
                x: adminX + 1,
                y: adminY
            }
        }));

        const message = await waitForAndPopLatestMessage(ws2Messages);

        expect(message.type).toBe("movement");
        expect(message.payload.userId).toBe(adminId);
        expect(message.payload.x).toBe(adminX + 1);
        expect(message.payload.y).toBe(adminY);
    });

    test("If a user leaves, the other users receive a leave event", async () => {
        await ws1.close();

        const message = await waitForAndPopLatestMessage(ws2Messages);

        expect(message.type).toBe("user-left");
        expect(message.payload.userId).toBe(adminId);
    });
})