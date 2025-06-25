import { Request, Response, NextFunction } from "express";
import util from 'util';

export const responseLogger = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    const startTime = Date.now();

    res.json = function (body: any) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Format log data with proper depth and colors
      const logData = {
        path: req.path,
        method: req.method,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        // response: body,
        requestBody: req.body,
        requestParams: req.params,
        requestQuery: req.query,
        timestamp: new Date().toISOString(),
      };

      // Use util.inspect for better formatting
      console.log('API Response:\n', util.inspect(logData, {
        depth: 10, // Increase depth for nested objects
        colors: true, // Enable colors
        maxArrayLength: null, // Show full arrays
        maxStringLength: null, // Show full strings
        compact: false, // Format objects across multiple lines
        breakLength: 320 // Line break at 80 characters
      }));

      return originalJson.call(this, body);
    };

    next();
  };
};