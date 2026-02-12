import type { Response } from 'express';
export declare class FileController {
    uploadFile(file: Express.Multer.File): {
        url: string;
    };
    getFile(filename: string, res: Response): Promise<void>;
}
