import { Response } from 'express';
import ResponseModel from "@models/response.model";

export function sendErrorResponse(res: Response, statusCode: number, message: string): void {
    const response = new ResponseModel({}, statusCode, message);
    res.status(statusCode).json(response.generate());
}