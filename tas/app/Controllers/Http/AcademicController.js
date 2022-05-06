"use strict";
const Exception = use("App/Exceptions/Handler");
const Logger = use("Logger");

const Academic = use("App/Models/Academic");
const Database = use("Database");
const Tag = use("App/Models/Tag");

class AcademicController {
  async addacademic({ request, response }) {
    try {
      const newAcademic = new Academic();
      newAcademic.name = request.input("name")
      newAcademic.year = request.input("year")
      newAcademic.school = request.input("school")
      newAcademic.load = request.input("load")

      //TODO This line for adding academic preferences works but needs to be implemented on DB
      newAcademic.academic_preferences = request.input("academic_preferences")
      //newAcademic.academic_preferences2 = request.input("academic_preferences2")

      await newAcademic.save()
      return response.route("/academics", true);
    } catch (error) {
      Logger.error('Add Academics' + error);
      throw new Exception();
    }
  }

  async updateacademic({ response, request }) {
    try {
      await Database.from("academics")
        .where("id", request.input("academicID"))
        .update({
          name: request.input("name"),
          load: request.input("load"),
        });

        if(request.input("tags")){
          //sanitise tag input
          var strTags = request.input("tags").replace(/\s/g, '');
          var tags= strTags.split('#')
          //first item in tags list is empty, so skipping it with i=1
          for(var x=1; x < tags.length; x++){
            const newTag = new Tag();
            newTag.tag = tags[x]
            newTag.academic_id = request.input("academicID")
            newTag.type = "academic"
            await newTag.save();
          }
        }
      return response.route("/academics", true);
    } catch (error) {
      Logger.error('Update Academics',  error);
      throw new Exception();
    }
  }

  async render({ request, view }) {
    try {
      if (request.input("search")) {
        var academics = await Database
        .select("*")
        .from("academics")
        .where("academics.name",'like',"%"+request.input("search")+"%")

      } else {
        var academics = await Database
        .select("academics.name","academics.id","academics.year","academics.school","academics.load")
        .from("academics")
      }
      console.log(academics)
      return view.render("academics", { academics: academics });
    } catch (error) {
      Logger.error(error);
      throw new Exception();
    }
  }
}
module.exports = AcademicController;
