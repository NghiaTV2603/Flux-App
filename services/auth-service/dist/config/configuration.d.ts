declare const _default: () => {
    port: number;
    database: {
        url: string;
    };
    redis: {
        url: string;
    };
    rabbitmq: {
        url: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
        refreshExpiresIn: string;
    };
    oauth: {
        google: {
            clientId: string;
            clientSecret: string;
        };
        facebook: {
            clientId: string;
            clientSecret: string;
        };
    };
    email: {
        smtp: {
            host: string;
            port: number;
            user: string;
            pass: string;
        };
        from: string;
    };
};
export default _default;
