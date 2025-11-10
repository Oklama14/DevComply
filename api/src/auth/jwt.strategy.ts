    import { Injectable } from '@nestjs/common';
    import { PassportStrategy } from '@nestjs/passport';
    import { ExtractJwt, Strategy } from 'passport-jwt';

    @Injectable()
    export class JwtStrategy extends PassportStrategy(Strategy) {
      constructor() {
        super({
          jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
          ignoreExpiration: false,
          secretOrKey: 'Direto00', // Deve ser o mesmo segredo do JwtModule
        });
      }

      async validate(payload: any) {
        // O payload é o que definimos no login (id e email)
        // O retorno desta função será injetado no objeto `request` do Express
        return { userId: payload.sub, email: payload.email };
      }
    }
    