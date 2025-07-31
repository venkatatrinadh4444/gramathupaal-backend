import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterEmployeeDto } from './dto/EmployeeDto';
import { catchBlock } from '../common/catch-block';
import * as bcrypt from 'bcrypt';
import { AssignMultiplePermissionsDto } from './dto/AssignMultiplePermissionsDto';
import { EmployeeLoginDto } from './dto/EmployeeLoginDto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class EmployeeService {
  constructor(private readonly prisma: PrismaService,private readonly jwt:JwtService) {}

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

      const idValue = "EMP"+length.toString().padStart(3,"0")

      const generateUsername =
        name.trim().replace(/\s+/g, '').toLowerCase() + length.toString().padStart(3, '0');

      const passwordString = name.slice(1)

      const generatePassword = name.slice(0,1).toUpperCase()+passwordString.trim().replace(/\s+/g, '').toLowerCase() + '@1234';

      await this.prisma.employee.create({
        data: {
          role: {
            connect: {
              name: roleName,
            },
          },
          id:idValue,
          name,
          ...restOfValues,
          username: generateUsername,
          password: generatePassword
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
  async fetchingAllEmployees(role:string,page:number) {
    try {
        const skip = (page - 1) * 25
        const limit = 25
        const totalRecordsCount = await this.prisma.employee.count({where:{roleName:role}})

        const totalUsers = await this.prisma.employee.findMany({where:{roleName:role},take:limit,skip:skip})

        const permissionDetails = await this.prisma.roleModuleAccess.findMany({where:{roleName:role}})

        const specificRoleDetails = {
          permissionDetails,
          totalUsers,
          totalRecordsCount,
          totalPage:Math.ceil(totalRecordsCount/25)
        }

        return {message:`Showing all details for the role ${role}`,specificRoleDetails}

    } catch (err) {
        catchBlock(err)
    }
  }

  //Edit the employee details
  async editEmployeeDetails(id:string,employee:RegisterEmployeeDto) {
    try {
       const existEmp:any = await this.prisma.employee.findUnique({where:{id}}) || (()=>{throw new BadRequestException('Employee not found!')})

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

        const digits = number ? number[0] : null
  
        const generateUsername =
          name.trim().replace(/\s+/g, '') + digits
  
        const passwordString = name.slice(1)

        const generatePassword = name.slice(0,1).toUpperCase()+passwordString.trim().replace(/\s+/g, '').toLowerCase() + '@1234';

        await this.prisma.employee.update({where:{id},data: {
            role: {
              connect: {
                name: roleName,
              },
            },
            name,
            ...restOfValues,
            username: generateUsername,
            password: await bcrypt.hash(generatePassword, 10),
          }})

        return {message:'Employee details updated successfully',allEmployees:await this.prisma.employee.findMany()}
  
    } catch (err) {
        catchBlock(err)
    }
  }

  //Delete employee
  async deleteEmployee(id:string) {
    try {
        await this.prisma.employee.delete({where:{id}}) || (()=>{throw new BadRequestException('Employee not found!')})
        return {message:'Employee deleted successfully!',allEmployees:await this.prisma.employee.findMany()}
    } catch (err) {
        catchBlock(err)
    }
  }

  //Get all the details for dashboard based on roles
  async getAllRoles(page:number,search:string,sortBy:string) {
    try {
        const skip = (page - 1) * 25
        const limit = 25
        let totalRecordsCount = await this.prisma.role.count()
        let allRoles = await this.prisma.role.findMany({orderBy:{createdAt:'desc'},take:limit,skip:skip})
        let message = 'Showing all roles'

        if(search) {
          message = `Showing all the records based on role ${search}`
          totalRecordsCount = await this.prisma.role.count({
            where:{
              name:{
                contains:search,
                mode:'insensitive'
              }
            },
          })
          allRoles = await this.prisma.role.findMany({
            where:{
              name:{
                contains:search,
                mode:'insensitive'
              }
            },
            take:limit,
            skip:skip
          })
        }

        if(sortBy) {
          message = `Showing the roles based on the sortBy value of ${sortBy}`
          switch(sortBy) {
            case "newest":
              allRoles = await this.prisma.role.findMany({orderBy:{createdAt:'desc'},take:limit,skip:skip})
              break;
            case "oldest":
              allRoles = await this.prisma.role.findMany({orderBy:{createdAt:'asc'},take:limit,skip:skip})
              break;
            case "name-asc":
              allRoles = await this.prisma.role.findMany({orderBy:{name:'asc'},take:limit,skip:skip})
              break;
            case "name-desc":
              allRoles = await this.prisma.role.findMany({orderBy:{name:'desc'},take:limit,skip:skip})
              break;
            default:
              throw new BadRequestException('Please enter a valid sortBy value')
          }
        }

        const allRolesDetails:any[] = []

        for(const eachRole of allRoles) {
            const totalUsers = await this.prisma.employee.count({where:{
                roleName:eachRole.name
            }})

            allRolesDetails.push({
                ...eachRole,
                totalUsers:totalUsers
            })
        }

        const roleDashboardData = {
          allRolesDetails,
          totalRecordsCount,
          totalPages:Math.ceil(totalRecordsCount/25)
        }
        

        return {message,roleDashboardData}
    } catch (err) {
        catchBlock(err)
    }
  }

  //Employee login
  async employeeLogin(loginDto:EmployeeLoginDto) {
    try {
        const { username , password } = loginDto
        const emp:any = await this.prisma.employee.findFirst({where:{
            OR : [
                {
                    email:username
                },
                {
                    username:username
                }
            ]
        }}) || (()=>{throw new UnauthorizedException("Employee not found!")})

        if(emp.password!==password) {
            throw new UnauthorizedException("Invalid Credentials")
        }

        const allowedPermissions = await this.prisma.roleModuleAccess.findMany({where:{
            roleName:emp.roleName
        }})

        const emp_token = this.jwt.sign({
            id:emp.id,
            name:emp.name,
            username:emp.username,
            role:emp.roleName
        })

        const employeeDetails = {
            emp_token,
            employeeDetails:emp,
            allowedPermissions
        }

        return { message:'Employee login successfull',employeeDetails}

    } catch (err) {
        catchBlock(err)
    }
  }

  //Fetching logged employee details
  async loggedEmployeeDetails(token:string,username:string) {
    try {
        const emp = await this.prisma.employee.findFirst({where:{username:username}})

        const allowedPermissions = await this.prisma.roleModuleAccess.findMany({where:{
            roleName:emp?.roleName
        }})

        const employeeDetails = {
            emp_token:token,
            employeeDetails:emp,
            allowedPermissions
        }

        return { message : "Showing the fetched employee details",employeeDetails}
        
    } catch (err) {
        catchBlock(err)
    }
  } 

}
