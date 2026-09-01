import mongoose from "mongoose"

const Connection = async (username, password) => {
    const URL = `mongodb://${username}:${password}@ac-q5mzaeb-shard-00-00.ehihisg.mongodb.net:27017,ac-q5mzaeb-shard-00-01.ehihisg.mongodb.net:27017,ac-q5mzaeb-shard-00-02.ehihisg.mongodb.net:27017/?ssl=true&replicaSet=atlas-3ykmbj-shard-0&authSource=admin&appName=Cluster0`;

    try {
        await mongoose.connect(URL);
        console.log("DB Connect Success");
    }
    catch (error) {
        console.log("Error ", error);
    }
}

export default Connection;