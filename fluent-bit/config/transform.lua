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
    
    -- Generate a unique ID
    record["id"] = record["container_name"] .. "-" .. tostring(timestamp)
    
    return 1, timestamp, record
end
