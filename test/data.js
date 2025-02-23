const shaderData = {
    structDefs: {
        Camera: {
            position: "vec3",
            color: "vec3",
        },
        Light: {
            camera: "Camera",
            position: ["vec3", 2],
            color: "vec3",
        },
    },
    structsData: {
        Camera: {
            position: "vec3",
            color: "vec3",
        },
        Light: {
            camera: {
                position: "vec3",
                color: "vec3",
            },
            position: ["vec3", "vec3"],
            color: "vec3",
        },
    },
    uniformDefs: {
        u_light: ["Light", 2],
    },
    uniformsData: {
        u_light: [
            {
                camera: {
                    position: "vec3",
                    color: "vec3",
                },
                position: ["vec3", "vec3"],
                color: "vec3",
            },
            {
                camera: {
                    position: "vec3",
                    color: "vec3",
                },
                position: ["vec3", "vec3"],
                color: "vec3",
            },
        ],
    },
};
