import { Course } from "./course.models11";

export interface Teacher {
    id: string;
    name: string;
    email:string;
    Courses: Course[];
}