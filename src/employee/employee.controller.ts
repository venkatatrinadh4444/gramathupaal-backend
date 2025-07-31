import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Req,UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { EmployeeService } from './employee.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { VerifySuperAdmin } from '../common/guards/verify-super-admin.guard';
import { RegisterEmployeeDto } from './dto/EmployeeDto';
import { AssignMultiplePermissionsDto } from './dto/AssignMultiplePermissionsDto';
import { EmployeeLoginDto } from './dto/EmployeeLoginDto';
import { VerifyEmployeeToken } from '../common/guards/verify-employee-token.guard';
import { Request } from 'express';

@ApiTags('Employee Module')
@ApiBearerAuth('access-token')
@Controller('api/super-admin')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

 // Registering a new employee
  @UseGuards(JwtAuthGuard, VerifySuperAdmin)
  @Post('create-employee')
  @ApiOperation({ summary: 'Register a new employee (Super Admin only)' })
  @ApiBody({
    type: RegisterEmployeeDto,
    description: 'Provide employee details including name, mobile, role, etc.',
  })
  @ApiResponse({
    status: 201,
    description: 'Employee created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or bad request',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token missing or invalid',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only Super Admin can access this route',
  })
  async createNewEmployee(@Body() employee: RegisterEmployeeDto) {
    return this.employeeService.createEmployee(employee);
  }

  //Adding or updating the access permissions
  @UseGuards(JwtAuthGuard, VerifySuperAdmin)
  @Post('add-permissions')
  @ApiOperation({
    summary: 'Assign or update access permissions for multiple modules to a role',
    description:
      'Allows Super Admin to assign view, edit, delete permissions for multiple modules to a specific role. If permissions already exist, they will be updated.',
  })
  @ApiBody({
    type: AssignMultiplePermissionsDto,
    description: 'Role name and list of module permissions',
    examples: {
      example1: {
        summary: 'Assign permissions to Manager role',
        value: {
          roleName: 'Manager',
          permissions: [
            {
              moduleName: 'Dashboard',
              canView: true,
              canEdit: false,
              canDelete: false,
            },
            {
              moduleName: 'Cattle Management',
              canView: true,
              canEdit: true,
              canDelete: false,
            },
            {
              moduleName: 'Milk Production',
              canView: true,
              canEdit: true,
              canDelete: false,
            },
            {
              moduleName: 'Cattle Checkups',
              canView: true,
              canEdit: true,
              canDelete: false,
            },
            {
              moduleName: 'Cattle VaccineManagement',
              canView: true,
              canEdit: true,
              canDelete: false,
            },
            {
              moduleName: 'Cattle FeedManagement',
              canView: true,
              canEdit: true,
              canDelete: false,
            },
            {
              moduleName: 'Feed Stock Management',
              canView: true,
              canEdit: true,
              canDelete: false,
            },
            {
              moduleName: 'Employee Management',
              canView: true,
              canEdit: true,
              canDelete: false,
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Permissions assigned or updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request or validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Missing or invalid JWT',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only accessible by Super Admin',
  })
  async addPermissions(
    @Body() permissions: AssignMultiplePermissionsDto,
  ) {
    return this.employeeService.createAccessForModules(permissions);
  }

  //Fetching all employees based on the role
  @UseGuards(JwtAuthGuard, VerifySuperAdmin)
  @Get('fetch-all-employees/:role/:page')
  @ApiOperation({ summary: 'Fetch all employees', description: 'Returns the list of all employees. Only accessible by Super Admin.' })
  @ApiParam({
    name:'role',
    required:true,
    description:'Enter the valid role of the employee',
    example:'Manager'
  })
  @ApiParam({
    name:'page',
    required:true,
    description:'Enter the value of the page',
    example:1
  })
  @ApiOkResponse({
    description: 'List of employees fetched successfully'
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized: JWT token is missing or invalid' })
  @ApiForbiddenResponse({ description: 'Forbidden: Only Super Admin can access this endpoint' })
  async getAllEmployees(@Param('role') role:string,@Param('page',ParseIntPipe) page:number) {
    return this.employeeService.fetchingAllEmployees(role,page);
  }

  //Edit the employee details
  @UseGuards(JwtAuthGuard, VerifySuperAdmin)
  @ApiBearerAuth()
  @Put('edit-employee/:id')
  @ApiOperation({ summary: 'Edit employee', description: 'Edits the details of an existing employee. Accessible only by Super Admin.' })
  @ApiOkResponse({ description: 'Employee updated successfully' })
  @ApiNotFoundResponse({ description: 'Employee not found' })
  @ApiBadRequestResponse({ description: 'Invalid input' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized: JWT token missing or invalid' })
  @ApiForbiddenResponse({ description: 'Forbidden: Only Super Admin can access this endpoint' })
  async editEmployee(
    @Param('id') id: string,
    @Body() employee: RegisterEmployeeDto,
  ) {
    return this.employeeService.editEmployeeDetails(id, employee);
  }

  //Delete employee
  @UseGuards(JwtAuthGuard, VerifySuperAdmin)
  @ApiBearerAuth()
  @Delete('delete-employee/:id')
  @ApiOperation({ summary: 'Soft delete employee', description: 'Marks the employee as inactive (soft delete). Accessible only by Super Admin.' })
  @ApiOkResponse({ description: 'Employee soft-deleted successfully' })
  @ApiNotFoundResponse({ description: 'Employee not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized: JWT token missing or invalid' })
  @ApiForbiddenResponse({ description: 'Forbidden: Only Super Admin can access this endpoint' })
  async deleteEmployee(@Param('id') id: string) {
    return this.employeeService.deleteEmployee(id);
  }

  //Get all the details for dashboard based on roles
  @UseGuards(JwtAuthGuard, VerifySuperAdmin)
  @ApiBearerAuth()
  @Get('fetch-all-roles/:page')
  @ApiOperation({ summary: 'Fetch all roles', description: 'Returns a list of all roles in the system. Accessible only by Super Admin.' })
  @ApiParam({
    name:'page',
    required:true,
    description:'Enter the value of the page',
    example:1
  })
  @ApiOkResponse({ description: 'Roles fetched successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized: JWT token missing or invalid' })
  @ApiForbiddenResponse({ description: 'Forbidden: Only Super Admin can access this endpoint' })
  async fetchAllRoles(@Param('page',ParseIntPipe) page:number) {
    return this.employeeService.getAllRoles(page);
  }

  //Employee login
  @Post('employee-login')
  @ApiOperation({ summary: 'Employee login', description: 'Authenticates an employee and returns access/refresh tokens.' })
  @ApiOkResponse({ description: 'Login successful' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ApiBadRequestResponse({ description: 'Invalid input payload' })
  async employeeLogin(@Body() loginDto: EmployeeLoginDto) {
    return this.employeeService.employeeLogin(loginDto);
  }

  //Fetching logged employee details
  @UseGuards(VerifyEmployeeToken)
  @ApiBearerAuth()
  @Get('fetch-employee-details')
  @ApiOperation({
    summary: 'Fetch logged-in employee details',
    description: 'Returns the details of the currently logged-in employee based on the verified token.',
  })
  @ApiOkResponse({
    description: 'Successfully fetched employee details'
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized: Invalid or missing employee token' })
  async fetchEmployeeDetails(@Req() req: Request) {
    const employee = (req as any).employee;
    return this.employeeService.loggedEmployeeDetails(employee?.token, employee?.username);
  }

}
