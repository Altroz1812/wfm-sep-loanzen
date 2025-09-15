export declare const config: {
    port: number;
    nodeEnv: string;
    supabase: {
        url: string;
        anonKey: string;
        serviceRoleKey: string;
    };
    redis: {
        host: string;
        port: number;
        password: string | undefined;
    };
    jwt: {
        secret: string;
        expiresIn: string;
    };
    cors: {
        origin: string | boolean;
    };
    db: {
        user: string;
        host: string;
        database: string;
        password: string;
        port: number;
    };
    ai: {
        baseUrl: string;
        apiKey: string;
    };
    upload: {
        maxSize: number;
        allowedTypes: string[];
    };
};
//# sourceMappingURL=index.d.ts.map