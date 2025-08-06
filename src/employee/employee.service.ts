import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterEmployeeDto } from './dto/EmployeeDto';
import { catchBlock } from '../common/catch-block';
import * as bcrypt from 'bcrypt';
import { AssignMultiplePermissionsDto } from './dto/AssignMultiplePermissionsDto';
import { Prisma } from '@prisma/client';
import { sendCredentials } from '../common/send-credentails';

@Injectable()
export class EmployeeService {
  constructor(
    private readonly prisma: PrismaService
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

      await this.prisma.employee.findFirst({where:{
        OR:[
          {
            mobile:employee?.mobile
          },
          {
            email:employee?.email
          }
        ]
      }}) && (()=>{throw new BadRequestException('Email or Mobile number is already in use')})()

      const latestEmployee = await this.prisma.employee.findFirst({
        orderBy: {
          id: 'desc',
        },
        where: {
          id: {
            startsWith: 'EMP',
          },
        },
      });
      
      const empId = latestEmployee?.id || 'EMP000';
      const digits = empId.match(/\d+/)?.[0] || '000';
      const idValue = 'EMP' + String((Number(digits) + 1)).padStart(3, '0');
    
      const generateUsername =
        name.trim().replace(/\s+/g, '').toLowerCase() + String((Number(digits)+1)).padStart(3,"0")

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

      if(employee.email) {
        console.log(employee.email)
        sendCredentials(employee.email,generateUsername,generatePassword)
      }

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
      const { roleName } = dto;

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
  async fetchingAllEmployeesBasedOnRole(role: string, page: number) {
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
        })()

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
          password:generatePassword
          // password: await bcrypt.hash(generatePassword, 10),
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
      (await this.prisma.employee.findUnique({ where: { id } }))
        ? null
        : (() => {
            throw new BadRequestException('Employee not found!');
          })();

      await this.prisma.employee.update({ where: { id } ,data:{
        active:false
      }});

      return {
        message: 'Employee status updated successfully!',
        allEmployees: await this.prisma.employee.findMany(),
      };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Fetch all role for user role dashboard
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
  
      // Sort (DB-level only for createdAt)
      let orderBy: any = { createdAt: 'desc' };
      let applyClientSort = false;
      let sortDirection = 'asc';
  
      switch (sortBy) {
        case 'oldest':
          orderBy = { createdAt: 'asc' };
          break;
        case 'newest':
          orderBy = { createdAt: 'desc' };
          break;
        case 'name-asc':
          applyClientSort = true;
          sortDirection = 'asc';
          break;
        case 'name-desc':
          applyClientSort = true;
          sortDirection = 'desc';
          break;
        case '':
        case undefined:
          break;
        default:
          throw new BadRequestException('Please enter a valid sortBy value');
      }
  
      // Fetch roles from DB
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
  
      // Optional: client-side sort
      let sortedRoles = allRoles;
      if (applyClientSort) {
        sortedRoles = allRoles.sort((a, b) => {
          const nameA = a.name.toLowerCase();
          const nameB = b.name.toLowerCase();
          if (nameA < nameB) return sortDirection === 'asc' ? -1 : 1;
          if (nameA > nameB) return sortDirection === 'asc' ? 1 : -1;
          return 0;
        });
      }
  
      // Count total users per role
      const roleNames = sortedRoles.map((role) => role.name);
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
  
      const allRolesDetails = sortedRoles.map((role) => ({
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
  
  //Deleting a specific role
  async deleteRole(id: number) {
    try {
      (await this.prisma.role.findFirst({ where: { id: id } })) ||
        (() => {
          throw new BadRequestException('Employee role record not found!');
        })();
      await this.prisma.role.delete({ where: { id } });
      return { message: 'Employee role record deleted successfully!' };
    } catch (err) {
      catchBlock(err);
    }
  }

  //Fetch all employees for employee dashboard
  async fetchAllEmployees(
    page: number,
    search: string,
    sortBy: string,
    filters: string[],
    fromDate: string,
    endDate: string,
  ) {
    try {
      const skip = (page - 1) * 25;
      const limit = 25;
      let message = 'Showing all the employees';
  
      const where: any = {};
  
      // Search Condition
      if (search) {
        message = `Showing the employees based on the ${search}`;
        where.OR = [
          {
            id: { contains: search, mode: 'insensitive' },
          },
          {
            name: { contains: search, mode: 'insensitive' },
          },
          {
            email: { contains: search, mode: 'insensitive' },
          },
          {
            roleName: { contains: search, mode: 'insensitive' },
          },
        ];
      }
  
      // Date Filter (fromDate to endDate)
      if (fromDate && endDate) {
        message = `Showing employees between ${fromDate} and ${endDate}`;
        const createdAtFilter = {
          createdAt: {
            gte: new Date(fromDate),
            lte: new Date(endDate),
          },
        };
        if (where.AND) {
          where.AND.push(createdAtFilter);
        } else {
          where.AND = [createdAtFilter];
        }
      }
  
      // Filter Condition (name + role)
      if (filters && filters.length > 0) {
        message = `Showing the employees based on the selected filters`;
  
        const nameMatches = await this.prisma.employee.findMany({
          where: { name: { in: filters } },
          select: { name: true },
        });
  
        const roleMatches = await this.prisma.employee.findMany({
          where: { roleName: { in: filters } },
          select: { roleName: true },
        });
  
        const names = [...new Set(nameMatches.map((e) => e.name))];
        const roles = [...new Set(roleMatches.map((e) => e.roleName))];
  
        if (names.length && roles.length) {
          // name + role combination with AND
          const filterOR = names
            .map((name) =>
              roles.map((role) => ({
                name: { equals: name, mode: Prisma.QueryMode.insensitive },
                roleName: { equals: role, mode: Prisma.QueryMode.insensitive },
              })),
            )
            .flat();
  
          if (where.AND) {
            where.AND.push({ OR: filterOR });
          } else {
            where.AND = [{ OR: filterOR }];
          }
        } else if (names.length || roles.length) {
          const filterOR = [
            ...names.map((name) => ({
              name: { equals: name, mode: Prisma.QueryMode.insensitive },
            })),
            ...roles.map((role) => ({
              roleName: { equals: role, mode: Prisma.QueryMode.insensitive },
            })),
          ];
          if (where.AND) {
            where.AND.push({ OR: filterOR });
          } else {
            where.AND = [{ OR: filterOR }];
          }
        }
      }
  
      // Sorting
      let orderBy: any = { createdAt: 'desc' };
      let applyClientSort = false;
      let sortDirection = 'asc';
  
      if (sortBy) {
        message = `Showing the employees based on the ${sortBy} value`;
        switch (sortBy) {
          case 'newest':
            orderBy = { createdAt: 'desc' };
            break;
          case 'oldest':
            orderBy = { createdAt: 'asc' };
            break;
          case 'name-asc':
            applyClientSort = true;
            sortDirection = 'asc';
            break;
          case 'name-desc':
            applyClientSort = true;
            sortDirection = 'desc';
            break;
          default:
            throw new BadRequestException('Please enter a valid sort value');
        }
      }
  
      // Final Query (no name sorting at DB level due to citext)
      const allEmployees = await this.prisma.employee.findMany({
        where,
        take: limit,
        skip,
        orderBy: applyClientSort ? undefined : orderBy, // Skip DB sort for name-based
      });
  
      // In-memory sort for name
      const sortedEmployees = applyClientSort
        ? allEmployees.sort((a, b) => {
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();
            if (nameA < nameB) return sortDirection === 'asc' ? -1 : 1;
            if (nameA > nameB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
          })
        : allEmployees;
  
      const totalCount = await this.prisma.employee.count({ where });
  
      const allEmployeeDetails = {
        allEmployees: sortedEmployees,
        totalRecordsCount: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      };
  
      return {
        message,
        allEmployeeDetails,
      };
    } catch (err) {
      catchBlock(err);
    }
  }
  
}
