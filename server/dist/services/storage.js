"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        const randomName = crypto_1.default.randomBytes(16).toString('hex');
        cb(null, `${randomName}${ext}`);
    }
});
exports.upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 1024 * 1024 * 500 // 500MB
    }
});
