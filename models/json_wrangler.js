function json_wrangler(){
    this.json = '';
    this.data = null;
    this.consume = function(json_data){
        try{
            this.json = json_data;
            this.data = JSON.parse(this.json);
            return this;
        } catch(err) {
            throw("Input is not valid JSON");
        }
    }
    this.data_keys = function(){
        return Object.keys(this.data);
    }
    this.count_inbound = function(){
        return this.get_inbound().length;
    }
    this.count_outbound = function(){
        return this.get_outbound().length;
    }
    this.get_inbound = function(){
        return this.data.individuals.arrivals;
    }
    this.get_outbound = function(){
        return this.data.individuals.departees;
    }
};
module.exports = json_wrangler;
