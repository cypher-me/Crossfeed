import {
  IsInt,
  IsPositive,
  IsString,
  IsIn,
  ValidateNested,
  isUUID,
  IsOptional,
  IsObject
} from 'class-validator';
import { Type } from 'class-transformer';
import { Domain, connectToDatabase } from '../models';
import { validateBody, wrapHandler, NotFound } from './helpers';
import { SelectQueryBuilder, In } from 'typeorm';
import { isGlobalViewAdmin, getOrgMemberships } from './auth';

const PAGE_SIZE = parseInt(process.env.PAGE_SIZE ?? '') || 25;

class DomainFilters {
  @IsString()
  @IsOptional()
  port?: string;

  @IsString()
  @IsOptional()
  service?: string;

  @IsString()
  @IsOptional()
  reverseName?: string;

  @IsString()
  @IsOptional()
  ip?: string;
}

class DomainSearch {
  @IsInt()
  @IsPositive()
  page: number = 1;

  @IsString()
  @IsIn(['name', 'reverseName', 'ip', 'updatedAt', 'id'])
  sort: string = 'name';

  @IsString()
  @IsIn(['ASC', 'DESC'])
  order: 'ASC' | 'DESC' = 'DESC';

  @Type(() => DomainFilters)
  @ValidateNested()
  @IsObject()
  @IsOptional()
  filters?: DomainFilters;

  filterResultQueryset(qs: SelectQueryBuilder<Domain>) {
    if (this.filters?.reverseName) {
      qs.andWhere('domain.name ILIKE :name', {
        name: `%${this.filters?.reverseName}%`
      });
    }
    if (this.filters?.ip) {
      qs.andWhere('domain.ip LIKE :ip', { ip: `%${this.filters?.ip}%` });
    }
    if (this.filters?.port) {
      qs.andHaving('COUNT(CASE WHEN services.port = :port THEN 1 END) >= 1', {
        port: this.filters?.port
      });
    }
    if (this.filters?.service) {
      qs.andHaving(
        'COUNT(CASE WHEN services.service ILIKE :service THEN 1 END) >= 1',
        { service: `%${this.filters?.service}%` }
      );
    }
    return qs;
  }

  async getResults(event) {
    const qs = Domain.createQueryBuilder('domain')
      .leftJoinAndSelect('domain.services', 'services')
      .leftJoinAndSelect('domain.organization', 'organization')
      .orderBy(`domain.${this.sort}`, this.order)
      .groupBy(
        'domain.id, domain.ip, domain.name, organization.id, services.id'
      )
      .skip(PAGE_SIZE * (this.page - 1))
      .take(PAGE_SIZE);

    if (!isGlobalViewAdmin(event)) {
      qs.andHaving('domain.organization IN (:...orgs)', {
        orgs: getOrgMemberships(event)
      });
    }

    this.filterResultQueryset(qs);
    return await qs.getMany();
  }

  filterCountQueryset(qs: SelectQueryBuilder<Domain>) {
    if (this.filters?.reverseName) {
      qs.andWhere('domain.name ILIKE :name', {
        name: `%${this.filters?.reverseName}%`
      });
    }
    if (this.filters?.ip) {
      qs.andWhere('domain.ip LIKE :ip', { ip: `%${this.filters?.ip}%` });
    }
    if (this.filters?.port) {
      qs.andWhere('services.port = :port', {
        port: this.filters?.port
      });
    }
    if (this.filters?.service) {
      qs.andWhere('services.service ILIKE :service', {
        service: `%${this.filters?.service}%`
      });
    }
  }

  async getCount(event) {
    const qs = Domain.createQueryBuilder('domain').leftJoin(
      'domain.services',
      'services'
    );
    if (!isGlobalViewAdmin(event)) {
      qs.andWhere('domain.organization IN (:...orgs)', {
        orgs: getOrgMemberships(event)
      });
    }
    this.filterCountQueryset(qs);
    return await qs.getCount();
  }
}

export const list = wrapHandler(async (event) => {
  if (!isGlobalViewAdmin(event) && getOrgMemberships(event).length === 0) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        result: [],
        count: 0
      })
    };
  }
  await connectToDatabase();
  const search = await validateBody(DomainSearch, event.body);
  const [result, count] = await Promise.all([
    search.getResults(event),
    search.getCount(event)
  ]);
  return {
    statusCode: 200,
    body: JSON.stringify({
      result,
      count
    })
  };
});

export const get = wrapHandler(async (event) => {
  let where = {};
  if (isGlobalViewAdmin(event)) {
    where = {};
  } else {
    where = { organization: In(getOrgMemberships(event)) };
  }
  await connectToDatabase();
  const id = event.pathParameters?.domainId;
  if (!isUUID(id)) {
    return NotFound;
  }

  const result = await Domain.findOne(
    { id, ...where },
    {
      relations: ['services', 'organization']
    }
  );

  return {
    statusCode: result ? 200 : 404,
    body: result ? JSON.stringify(result) : ''
  };
});
