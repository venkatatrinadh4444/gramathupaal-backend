import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterEmployeeDto } from './dto/EmployeeDto';
import { catchBlock } from '../common/catch-block';
import * as bcrypt from 'bcrypt';
import { AssignMultiplePermissionsDto } from './dto/AssignMultiplePermissionsDto';
import { EmployeeLoginDto } from './dto/EmployeeLoginDto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class EmployeeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  // Registering a new employee
  async createEmployee(employee: RegisterEmployeeDto) {
    try {
      const { roleName, name, ...restOfValues } = employee;
      const roleExisted = await this.prisma.role.findFirst({
        where: {
          name: {
            contains: roleName,
            mode: 'insensitive',
          },
        },
      });

      !roleExisted &&
        (await this.prisma.role.create({
          data: {
            name: roleName,
          },
        }));

      const length = (await this.prisma.employee.count()) + 1;

      const idValue = 'EMP' + length.toString().padStart(3, '0');

      const generateUsername =
        name.trim().replace(/\s+/g, '').toLowerCase() +
        length.toString().padStart(3, '0');

      const passwordString = name.slice(1);

      const generatePassword =
        name.slice(0, 1).toUpperCase() +
        passwordString.trim().replace(/\s+/g, '').toLowerCase() +
        '@1234';

      await this.prisma.employee.create({
        data: {
          role: {
            connect: {
              name: roleName,
            },
          },
          id: idValue,
          name,
          ...restOfValues,
          username: generateUsername,
          password: generatePassword,
          //   password: await bcrypt.hash(generatePassword, 10),
        },
      });

      return {
        message: 'New employee created successfully',
        employeeDetails: await this.prisma.employee.findMany(),
      };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Adding or updating the access permissions
  async createAccessForModules(dto: AssignMultiplePermissionsDto) {
    try {
      const role = await this.prisma.role.findUnique({
        where: { name: dto.roleName },
      });

      if (!role) {
        throw new NotFoundException(`Role "${dto.roleName}" does not exist`);
      }

      for (const access of dto.permissions) {
        const module = await this.prisma.module.findUnique({
          where: { name: access.moduleName },
        });

        if (!module) {
          throw new NotFoundException(
            `Module "${access.moduleName}" does not exist`,
          );
        }

        // Upsert RoleModuleAccess
        await this.prisma.roleModuleAccess.upsert({
          where: {
            roleName_moduleName: {
              roleName: dto.roleName,
              moduleName: access.moduleName,
            },
          },
          update: {
            canView: access.canView,
            canEdit: access.canEdit,
            canDelete: access.canDelete,
          },
          create: {
            roleName: dto.roleName,
            moduleName: access.moduleName,
            canView: access.canView,
            canEdit: access.canEdit,
            canDelete: access.canDelete,
          },
        });
      }

      return { message: 'Access permissions assigned successfully' };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Fetching all employees based on the role
  async fetchingAllEmployees(role: string, page: number) {
    try {
      const skip = (page - 1) * 25;
      const limit = 25;
      const totalRecordsCount = await this.prisma.employee.count({
        where: { roleName: role },
      });

      const totalUsers = await this.prisma.employee.findMany({
        where: { roleName: role },
        take: limit,
        skip: skip,
      });

      const permissionDetails = await this.prisma.roleModuleAccess.findMany({
        where: { roleName: role },
      });

      const specificRoleDetails = {
        permissionDetails,
        totalUsers,
        totalRecordsCount,
        totalPage: Math.ceil(totalRecordsCount / 25),
      };

      return {
        message: `Showing all details for the role ${role}`,
        specificRoleDetails,
      };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Edit the employee details
  async editEmployeeDetails(id: string, employee: RegisterEmployeeDto) {
    try {
      const existEmp: any =
        (await this.prisma.employee.findUnique({ where: { id } })) ||
        (() => {
          throw new BadRequestException('Employee not found!');
        });

      const { roleName, name, ...restOfValues } = employee;
      const roleExisted = await this.prisma.role.findFirst({
        where: {
          name: {
            contains: roleName,
            mode: 'insensitive',
          },
        },
      });

      !roleExisted &&
        (await this.prisma.role.create({
          data: {
            name: roleName,
          },
        }));

      const number = existEmp?.username?.match(/\d+$/);

      const digits = number ? number[0] : null;

      const generateUsername = name.trim().replace(/\s+/g, '') + digits;

      const passwordString = name.slice(1);

      const generatePassword =
        name.slice(0, 1).toUpperCase() +
        passwordString.trim().replace(/\s+/g, '').toLowerCase() +
        '@1234';

      await this.prisma.employee.update({
        where: { id },
        data: {
          role: {
            connect: {
              name: roleName,
            },
          },
          name,
          ...restOfValues,
          username: generateUsername,
          password: await bcrypt.hash(generatePassword, 10),
        },
      });

      return {
        message: 'Employee details updated successfully',
        allEmployees: await this.prisma.employee.findMany(),
      };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Delete employee
  async deleteEmployee(id: string) {
    try {
      (await this.prisma.employee.delete({ where: { id } })) ||
        (() => {
          throw new BadRequestException('Employee not found!');
        });
      return {
        message: 'Employee deleted successfully!',
        allEmployees: await this.prisma.employee.findMany(),
      };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Get all the details for dashboard based on roles
  // async getAllRoles(
  //   page: number,
  //   search: string,
  //   sortBy: string,
  //   filter: string[],
  //   fromDate: string,
  //   toDate: string,
  // ) {
  //   try {
  //     const skip = (page - 1) * 25;
  //     const limit = 25;
  //     let allRoles = await this.prisma.role.findMany({
  //       orderBy: { createdAt: 'desc' },
  //       take: limit,
  //       skip: skip,
  //     });
  //     let message = 'Showing all roles';

  //     if (search) {
  //       message = `Showing all the records based on role ${search}`;
  //       allRoles = await this.prisma.role.findMany({
  //         where: {
  //           name: {
  //             contains: search,
  //             mode: 'insensitive',
  //           },
  //         },
  //         take: limit,
  //         skip: skip,
  //       });
  //     }

  //     if (sortBy) {
  //       message = `Showing the roles based on the sortBy value of ${sortBy}`;
  //       switch (sortBy) {
  //         case 'newest':
  //           allRoles = await this.prisma.role.findMany({
  //             orderBy: { createdAt: 'desc' },
  //             take: limit,
  //             skip: skip,
  //           });
  //           break;
  //         case 'oldest':
  //           allRoles = await this.prisma.role.findMany({
  //             orderBy: { createdAt: 'asc' },
  //             take: limit,
  //             skip: skip,
  //           });
  //           break;
  //         case 'name-asc':
  //           allRoles = await this.prisma.role.findMany({
  //             orderBy: { name: 'asc' },
  //             take: limit,
  //             skip: skip,
  //           });
  //           break;
  //         case 'name-desc':
  //           allRoles = await this.prisma.role.findMany({
  //             orderBy: { name: 'desc' },
  //             take: limit,
  //             skip: skip,
  //           });
  //           break;
  //         default:
  //           throw new BadRequestException('Please enter a valid sortBy value');
  //       }
  //     }

  //     if (filter && Array.isArray(filter) && filter.length>0) {
  //       message = `Showing the roles based on the selected filters`
  //       allRoles = [];
  //       for (const eachValue of filter) {
  //         const matchedRecord = await this.prisma.role.findFirst({
  //           where: {
  //             name: {
  //               contains: eachValue,
  //               mode: 'insensitive',
  //             },
  //           },
  //         });
  //         if (matchedRecord) {
  //           allRoles.push(matchedRecord);
  //         }
  //       }
  //     }

  //     if (
  //       filter &&
  //       Array.isArray(filter) &&
  //       filter.length > 0 &&
  //       fromDate &&
  //       toDate
  //     ) {
  //       message = `Showing the roles based on the selected filters along with specified dates`
  //       allRoles = [];
  //       const startDate = new Date(fromDate)
  //       startDate.setHours(0,0,0,0)
  //       const endDate = new Date(toDate)
  //       endDate.setHours(23,59,59,999)
  //       for (const eachValue of filter) {
  //         const matchedRecord = await this.prisma.role.findFirst({
  //           where: {
  //             AND: [
  //               {
  //                 name: {
  //                   contains: eachValue,
  //                   mode: 'insensitive',
  //                 },
  //               },
  //               {
  //                 createdAt:{
  //                   gte:startDate,
  //                   lte:endDate
  //                 }
  //               }
  //             ],
  //           },
  //         });
  //         if (matchedRecord) {
  //           allRoles.push(matchedRecord);
  //         }
  //       }
  //     }

  //     if(fromDate && toDate) {
  //       message = `Showing all the roles based on the ${fromDate} to ${toDate}`
  //       const startDate = new Date(fromDate)
  //       startDate.setHours(0,0,0,0)
  //       const endDate = new Date(toDate)
  //       endDate.setHours(23,59,59,999)
  //       allRoles = await this.prisma.role.findMany({
  //         where:{
  //           createdAt:{
  //             gte:startDate,
  //             lte:endDate
  //           }
  //         }
  //       })
  //     }

  //     const allRolesDetails: any[] = [];

  //     for (const eachRole of allRoles) {
  //       const totalUsers = await this.prisma.employee.count({
  //         where: {
  //           roleName: eachRole.name,
  //         },
  //       });

  //       allRolesDetails.push({
  //         ...eachRole,
  //         totalUsers: totalUsers,
  //       });
  //     }

  //     const roleDashboardData = {
  //       allRolesDetails,
  //       totalRecordsCount:allRoles.length,
  //       totalPages: Math.ceil(allRoles.length / 25),
  //     };

  //     return { message, roleDashboardData };
  //   } catch (err) {
  //     catchBlock(err);
  //   }
  // }

  async getAllRoles(
    page: number,
    search: string,
    sortBy: string,
    filter: string[],
    fromDate: string,
    toDate: string,
  ) {
    try {
      const skip = (page - 1) * 25;
      const limit = 25;

      const whereConditions: any = {};

      // Search
      if (search) {
        whereConditions.name = {
          contains: search,
          mode: 'insensitive',
        };
      }

      // Filter
      if (filter && filter.length > 0) {
        whereConditions.OR = filter.map((value) => ({
          name: {
            contains: value,
            mode: 'insensitive',
          },
        }));
      }

      // Date range
      if (fromDate && toDate) {
        const startDate = new Date(fromDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);

        whereConditions.createdAt = {
          gte: startDate,
          lte: endDate,
        };
      }

      // Sort
      let orderBy: any = { createdAt: 'desc' };
      switch (sortBy) {
        case 'oldest':
          orderBy = { createdAt: 'asc' };
          break;
        case 'name-asc':
          orderBy = { name: 'asc' };
          break;
        case 'name-desc':
          orderBy = { name: 'desc' };
          break;
        case 'newest':
          orderBy = { createdAt: 'desc' };
          break;
        case '':
        case undefined:
          break;
        default:
          throw new BadRequestException('Please enter a valid sortBy value');
      }

      // Fetch roles
      const [allRoles, totalRecordsCount] = await this.prisma.$transaction([
        this.prisma.role.findMany({
          where: whereConditions,
          orderBy,
          take: limit,
          skip,
        }),
        this.prisma.role.count({
          where: whereConditions,
        }),
      ]);

      // Fetch total users for each role
      const roleNames = allRoles.map((role) => role.name);
      const userCounts = await this.prisma.employee.groupBy({
        by: ['roleName'],
        where: { roleName: { in: roleNames } },
        _count: true,
      });

      const userCountMap = userCounts.reduce(
        (acc, curr) => {
          acc[curr.roleName] = curr._count;
          return acc;
        },
        {} as Record<string, number>,
      );

      const allRolesDetails = allRoles.map((role) => ({
        ...role,
        totalUsers: userCountMap[role.name] || 0,
      }));

      // Dynamic message
      let message = 'Showing all roles';
      if (search) message = `Showing roles based on search: ${search}`;
      if (sortBy) message = `Showing roles sorted by: ${sortBy}`;
      if (filter && filter.length > 0)
        message = `Showing roles filtered by selected filters`;
      if (fromDate && toDate) {
        const fromLabel = new Date(fromDate).toLocaleDateString();
        const toLabel = new Date(toDate).toLocaleDateString();
        message = `Showing roles from ${fromLabel} to ${toLabel}`;
      }
      if (filter.length > 0 && fromDate && toDate) {
        message = `Showing roles based on filters and date range`;
      }

      return {
        message,
        roleDashboardData: {
          allRolesDetails,
          totalRecordsCount,
          totalPages: Math.ceil(totalRecordsCount / limit),
        },
      };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Employee login
  async employeeLogin(loginDto: EmployeeLoginDto) {
    try {
      const { username, password } = loginDto;
      const emp: any =
        (await this.prisma.employee.findFirst({
          where: {
            OR: [
              {
                email: username,
              },
              {
                username: username,
              },
            ],
          },
        })) ||
        (() => {
          throw new UnauthorizedException('Employee not found!');
        });

      if (emp.password !== password) {
        throw new UnauthorizedException('Invalid Credentials');
      }

      const allowedPermissions = await this.prisma.roleModuleAccess.findMany({
        where: {
          roleName: emp.roleName,
        },
      });

      const emp_token = this.jwt.sign({
        id: emp.id,
        name: emp.name,
        username: emp.username,
        role: emp.roleName,
      });

      const employeeDetails = {
        emp_token,
        employeeDetails: emp,
        allowedPermissions,
      };

      return { message: 'Employee login successfull', employeeDetails };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Fetching logged employee details
  async loggedEmployeeDetails(token: string, username: string) {
    try {
      const emp = await this.prisma.employee.findFirst({
        where: { username: username },
      });

      const allowedPermissions = await this.prisma.roleModuleAccess.findMany({
        where: {
          roleName: emp?.roleName,
        },
      });

      const employeeDetails = {
        emp_token: token,
        employeeDetails: emp,
        allowedPermissions,
      };

      return {
        message: 'Showing the fetched employee details',
        employeeDetails,
      };
    } catch (err) {
      catchBlock(err);
    }
  }
}
