function modify_record(tag, timestamp, record)
    if type(record["container_id"]) == "table" then
        record["container_id"] = record["container_id"][1]
    end
    if type(record["container_name"]) == "table" then
        record["container_name"] = record["container_name"][1]
    end
    if type(record["source"]) == "table" then
        record["source"] = record["source"][1]
    end
    if type(record["log"]) == "table" then
        record["log"] = record["log"][1]
    end
    
    -- Convert timestamp to the ISO-8601 format expected by Solr
    local date_format = "%Y-%m-%dT%H:%M:%SZ"  -- ISO-8601 format in UTC
    local formatted_time = os.date("!" .. date_format, math.floor(timestamp))
    
    -- Generate a unique ID with the formatted timestamp
    record["id"] = record["container_name"] .. "-" .. formatted_time
    
    -- Store the formatted date in the new date_formatted field
    record["date_formatted"] = formatted_time
    
    return 1, timestamp, record
end
