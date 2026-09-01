import mongoose from 'mongoose';

const TokenSchema = mongoose.Schema({
    token: {
        type: String,
        required: true
    }
}, {
    timestamps: true
}
);


const token = mongoose.model('token', TokenSchema);

export default token;